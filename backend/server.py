"""Point d'entrée principal — Youdom Care CRM API."""
import logging
import sys
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pymongo.errors import (
    DuplicateKeyError, ConnectionFailure, OperationFailure, WriteError
)
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config import get_settings
from database import connect_db, disconnect_db, create_indexes, get_db
from auth import (
    get_google_auth_url, exchange_google_code, get_google_user_info,
    get_or_create_user, create_session, delete_session, get_current_user,
    require_permission
)
from utils import generate_secure_token, serialize_doc
from models import UserUpdate, RoleUtilisateur

# Routes modules
from beneficiaires import router as beneficiaires_router
from familles import router as familles_router
from intervenants import router as intervenants_router
from prescripteurs import router as prescripteurs_router
from leads import router as leads_router
from services import router as services_router
from planning import router as planning_router
from devis_contrats import router as devis_contrats_router
from facturation import router as facturation_router
from qualite import router as qualite_router
from notifications import router as notifications_router
from communications import router as communications_router
from dashboard import router as dashboard_router
from conformite import router as conformite_router
from portail import router as portail_router

# ============================================================
# Configuration
# ============================================================

settings = get_settings()

logging.basicConfig(
    level=logging.DEBUG if not settings.is_production else logging.INFO,
    format="%(asctime)s — %(name)s — %(levelname)s — %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ]
)
logger = logging.getLogger("youdom_care")


# ============================================================
# Rate Limiter
# ============================================================

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


# ============================================================
# Lifespan
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle de l'application."""
    logger.info("🚀 Démarrage Youdom Care CRM...")
    await connect_db()
    await create_indexes()
    logger.info("✅ Application prête")
    yield
    logger.info("🛑 Arrêt de l'application...")
    await disconnect_db()


# ============================================================
# Application FastAPI
# ============================================================

app = FastAPI(
    title="Youdom Care CRM",
    description="CRM professionnel pour services d'aide à domicile — Paris 12e",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["X-Total-Count"],
    max_age=3600,
)


# ============================================================
# Security Headers Middleware
# ============================================================

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Ajouter les headers de sécurité."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# ============================================================
# Exception Handlers MongoDB
# ============================================================

@app.exception_handler(DuplicateKeyError)
async def duplicate_key_handler(request: Request, exc: DuplicateKeyError):
    logger.warning(f"Clé dupliquée MongoDB: {exc}")
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Un enregistrement avec ces informations existe déjà"}
    )


@app.exception_handler(ConnectionFailure)
async def connection_failure_handler(request: Request, exc: ConnectionFailure):
    logger.error(f"Connexion MongoDB perdue: {exc}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Service temporairement indisponible"}
    )


@app.exception_handler(OperationFailure)
async def operation_failure_handler(request: Request, exc: OperationFailure):
    logger.error(f"Opération MongoDB échouée: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Erreur interne de la base de données"}
    )


@app.exception_handler(WriteError)
async def write_error_handler(request: Request, exc: WriteError):
    logger.error(f"Erreur d'écriture MongoDB: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Erreur lors de l'enregistrement"}
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Erreur non gérée: {type(exc).__name__}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Une erreur interne s'est produite"}
    )


# ============================================================
# Routes Auth Google OAuth
# ============================================================

@app.get("/auth/google", tags=["Auth"])
@limiter.limit("10/minute")
async def auth_google_login(request: Request):
    """Initier l'authentification Google OAuth."""
    state = generate_secure_token(16)
    # Stocker le state pour vérification CSRF
    db = get_db()
    await db.oauth_states.insert_one({
        "state": state,
        "expires_at": datetime.utcnow(),
        "created_at": datetime.utcnow(),
    })
    url = get_google_auth_url(state)
    return {"url": url, "state": state}


@app.get("/auth/google/callback", tags=["Auth"])
@limiter.limit("10/minute")
async def auth_google_callback(request: Request, code: str, state: str):
    """Callback OAuth Google — échange du code et création de session."""
    db = get_db()

    # Vérifier le state (protection CSRF)
    oauth_state = await db.oauth_states.find_one_and_delete({"state": state})
    if not oauth_state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="État OAuth invalide ou expiré"
        )

    # Échanger le code
    token_data = await exchange_google_code(code)
    access_token = token_data.get("access_token")

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token d'accès Google invalide"
        )

    # Obtenir le profil Google
    google_info = await get_google_user_info(access_token)

    # Créer/récupérer l'utilisateur
    user = await get_or_create_user(google_info)

    if not user.get("actif", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé. Contactez l'administrateur."
        )

    # Créer la session
    session_token = await create_session(user["id"], {
        "ip": request.client.host if request.client else None,
        "user_agent": request.headers.get("User-Agent"),
    })

    # Rediriger vers le frontend avec le token
    response = RedirectResponse(
        url=f"{settings.app_url}/auth/callback?token={session_token}",
        status_code=302
    )
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=settings.session_expire_hours * 3600,
    )
    return response


@app.post("/auth/logout", tags=["Auth"])
async def logout(request: Request):
    """Déconnecter l'utilisateur."""
    token = request.cookies.get("session_token")
    if token:
        await delete_session(token)

    response = JSONResponse(content={"message": "Déconnexion réussie"})
    response.delete_cookie("session_token")
    return response


@app.get("/auth/me", tags=["Auth"])
async def get_me(current_user: dict = Depends(get_current_user)):
    """Profil de l'utilisateur courant."""
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "nom": current_user["nom"],
        "prenom": current_user["prenom"],
        "role": current_user["role"],
        "google_picture": current_user.get("google_picture"),
        "last_login": current_user.get("last_login"),
    }


# ============================================================
# Routes Utilisateurs CRM
# ============================================================

@app.get("/users", tags=["Utilisateurs"])
async def list_users(current_user: dict = Depends(require_permission("users:read"))):
    """Lister les utilisateurs CRM."""
    db = get_db()
    users = await db.users.find({}).to_list(length=100)
    return [serialize_doc(u) for u in users]


@app.patch("/users/{user_id}", tags=["Utilisateurs"])
async def update_user(
    user_id: str,
    data: UserUpdate,
    current_user: dict = Depends(require_permission("admin"))
):
    """Modifier un utilisateur (admin seulement)."""
    from bson import ObjectId
    db = get_db()

    update_data = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à modifier")

    update_data["updated_at"] = datetime.utcnow()
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    return serialize_doc(user)


# ============================================================
# Health Check
# ============================================================

@app.get("/health", tags=["System"])
async def health_check():
    """Vérification de l'état du service."""
    try:
        db = get_db()
        await db.command("ping")
        return {
            "status": "healthy",
            "service": "Youdom Care CRM",
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected",
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }
        )


@app.get("/", tags=["System"])
async def root():
    """Endpoint racine."""
    return {
        "name": "Youdom Care CRM",
        "version": "1.0.0",
        "description": "CRM professionnel pour services d'aide à domicile",
        "docs": "/docs",
    }


# ============================================================
# Inclusion des Routers
# ============================================================

app.include_router(beneficiaires_router, prefix="/api/v1/beneficiaires", tags=["Bénéficiaires"])
app.include_router(familles_router, prefix="/api/v1/familles", tags=["Familles"])
app.include_router(intervenants_router, prefix="/api/v1/intervenants", tags=["Intervenants"])
app.include_router(prescripteurs_router, prefix="/api/v1/prescripteurs", tags=["Prescripteurs"])
app.include_router(leads_router, prefix="/api/v1/leads", tags=["Leads"])
app.include_router(services_router, prefix="/api/v1/services", tags=["Services"])
app.include_router(planning_router, prefix="/api/v1/planning", tags=["Planning"])
app.include_router(devis_contrats_router, prefix="/api/v1/devis-contrats", tags=["Devis & Contrats"])
app.include_router(facturation_router, prefix="/api/v1/facturation", tags=["Facturation"])
app.include_router(qualite_router, prefix="/api/v1/qualite", tags=["Qualité"])
app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(communications_router, prefix="/api/v1/communications", tags=["Communications"])
app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(conformite_router, prefix="/api/v1/conformite", tags=["Conformité"])
app.include_router(portail_router, prefix="/api/v1/portail", tags=["Portail Familles"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=not settings.is_production,
        log_level="info",
        access_log=True,
    )
