"""Module d'authentification — Google OAuth + sessions."""
import logging
from datetime import datetime, timedelta
from typing import Optional
import httpx
from fastapi import Request, HTTPException, status, Depends
from database import get_db
from models import RoleUtilisateur
from utils import generate_secure_token, serialize_doc
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def get_google_auth_url(state: str) -> str:
    """Construire l'URL d'autorisation Google."""
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{GOOGLE_AUTH_URL}?{query}"


async def exchange_google_code(code: str) -> dict:
    """Échanger le code d'autorisation contre un token Google."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Échange de code Google échoué"
            )
        return response.json()


async def get_google_user_info(access_token: str) -> dict:
    """Obtenir les informations utilisateur depuis Google."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Récupération profil Google échouée"
            )
        return response.json()


async def create_session(user_id: str, user_data: dict) -> str:
    """Créer une session utilisateur."""
    db = get_db()
    token = generate_secure_token(32)
    expires_at = datetime.utcnow() + timedelta(hours=settings.session_expire_hours)

    await db.sessions.insert_one({
        "token": token,
        "user_id": user_id,
        "user_data": user_data,
        "expires_at": expires_at,
        "created_at": datetime.utcnow(),
        "ip": user_data.get("ip"),
        "user_agent": user_data.get("user_agent"),
    })

    logger.info(f"Session créée pour user {user_id}")
    return token


async def get_session(token: str) -> Optional[dict]:
    """Récupérer une session valide."""
    db = get_db()
    session = await db.sessions.find_one({
        "token": token,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    return session


async def delete_session(token: str):
    """Supprimer une session."""
    db = get_db()
    await db.sessions.delete_one({"token": token})


async def get_or_create_user(google_info: dict) -> dict:
    """Récupérer ou créer un utilisateur CRM depuis les infos Google."""
    db = get_db()
    google_id = google_info["id"]
    email = google_info["email"]

    # Chercher par google_id ou email
    user = await db.users.find_one({
        "$or": [{"google_id": google_id}, {"email": email}]
    })

    if user:
        # Mettre à jour le profil Google
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "google_id": google_id,
                "google_picture": google_info.get("picture"),
                "last_login": datetime.utcnow(),
            }}
        )
        return serialize_doc(user)
    else:
        # Créer un nouvel utilisateur
        # Premier utilisateur = admin
        count = await db.users.count_documents({})
        role = RoleUtilisateur.ADMIN if count == 0 else RoleUtilisateur.COORDINATION

        new_user = {
            "google_id": google_id,
            "email": email,
            "nom": google_info.get("family_name", ""),
            "prenom": google_info.get("given_name", ""),
            "google_picture": google_info.get("picture"),
            "role": role.value,
            "actif": True,
            "created_at": datetime.utcnow(),
            "last_login": datetime.utcnow(),
        }

        result = await db.users.insert_one(new_user)
        new_user["_id"] = result.inserted_id
        logger.info(f"Nouvel utilisateur créé: {email} ({role.value})")
        return serialize_doc(new_user)


async def get_current_user(request: Request) -> dict:
    """Middleware: Obtenir l'utilisateur courant depuis le cookie de session."""
    token = request.cookies.get("session_token")
    if not token:
        # Essayer le header Authorization
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise"
        )

    session = await get_session(token)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expirée ou invalide"
        )

    db = get_db()
    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(session["user_id"])})

    if not user or not user.get("actif", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Compte désactivé"
        )

    return serialize_doc(user)


async def get_current_user_optional(request: Request) -> Optional[dict]:
    """Obtenir l'utilisateur courant optionnellement (sans erreur si absent)."""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


def require_role(*roles: RoleUtilisateur):
    """Décorateur: Exiger un rôle spécifique."""
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in [r.value for r in roles] and user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissions insuffisantes"
            )
        return current_user
    return role_checker


def require_permission(permission: str):
    """Décorateur: Exiger une permission spécifique."""
    from utils import has_permission

    async def permission_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role", "")
        if not has_permission(user_role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' requise"
            )
        return current_user
    return permission_checker
