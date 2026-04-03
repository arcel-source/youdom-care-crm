"""Connexion et gestion de la base MongoDB."""
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_db():
    """Établir la connexion MongoDB."""
    global client, db
    try:
        client = AsyncIOMotorClient(
            settings.mongodb_url,
            serverSelectionTimeoutMS=5000,
            maxPoolSize=10,
            minPoolSize=1,
        )
        db = client[settings.mongodb_db]
        # Vérifier la connexion
        await client.admin.command("ping")
        logger.info(f"✅ MongoDB connecté: {settings.mongodb_db}")
    except Exception as e:
        logger.error(f"❌ Erreur connexion MongoDB: {e}")
        raise


async def disconnect_db():
    """Fermer la connexion MongoDB."""
    global client
    if client:
        client.close()
        logger.info("MongoDB déconnecté")


async def create_indexes():
    """Créer les index MongoDB pour les performances."""
    global db
    if db is None:
        return

    # Beneficiaires
    await db.beneficiaires.create_index("numero_dossier", unique=True, sparse=True)
    await db.beneficiaires.create_index("statut")
    await db.beneficiaires.create_index("type_public")
    await db.beneficiaires.create_index([("nom", 1), ("prenom", 1)])
    await db.beneficiaires.create_index("email")

    # Familles
    await db.familles.create_index("beneficiaire_ids")
    await db.familles.create_index([("nom", 1), ("prenom", 1)])

    # Intervenants
    await db.intervenants.create_index("email", unique=True)
    await db.intervenants.create_index("statut")
    await db.intervenants.create_index("competences")

    # Leads
    await db.leads.create_index("statut")
    await db.leads.create_index("created_at")
    await db.leads.create_index("score")
    await db.leads.create_index("email")

    # Prescripteurs
    await db.prescripteurs.create_index("type_structure")
    await db.prescripteurs.create_index([("nom", 1), ("prenom", 1)])

    # Planning
    await db.planning.create_index("beneficiaire_id")
    await db.planning.create_index("intervenant_id")
    await db.planning.create_index("date_debut")
    await db.planning.create_index([("intervenant_id", 1), ("date_debut", 1)])
    await db.planning.create_index([("beneficiaire_id", 1), ("date_debut", 1)])

    # Devis/Contrats
    await db.devis_contrats.create_index("beneficiaire_id")
    await db.devis_contrats.create_index("statut")
    await db.devis_contrats.create_index("numero", unique=True, sparse=True)

    # Facturation
    await db.factures.create_index("beneficiaire_id")
    await db.factures.create_index("statut_paiement")
    await db.factures.create_index("date_emission")
    await db.factures.create_index("numero", unique=True, sparse=True)

    # Qualite
    await db.tickets_qualite.create_index("statut")
    await db.tickets_qualite.create_index("priorite")
    await db.tickets_qualite.create_index("beneficiaire_id")

    # Notifications
    await db.notifications.create_index("user_id")
    await db.notifications.create_index("lu")
    await db.notifications.create_index("created_at")

    # Communications
    await db.communications.create_index("destinataire_id")
    await db.communications.create_index("type_acteur")
    await db.communications.create_index("created_at")

    # Services
    await db.services.create_index("type_service")
    await db.services.create_index("actif")

    # Sessions
    await db.sessions.create_index("token", unique=True)
    await db.sessions.create_index("expires_at", expireAfterSeconds=0)

    # OTP intervenants
    await db.otp_codes.create_index("email")
    await db.otp_codes.create_index("expires_at", expireAfterSeconds=0)

    # Magic links portail
    await db.magic_links.create_index("token", unique=True)
    await db.magic_links.create_index("expires_at", expireAfterSeconds=0)

    # Utilisateurs CRM
    await db.users.create_index("email", unique=True)
    await db.users.create_index("google_id", unique=True, sparse=True)

    # Conformite APA/PCH
    await db.conformite_documents.create_index("beneficiaire_id")
    await db.conformite_documents.create_index("type_aide")
    await db.conformite_documents.create_index("date_expiration")

    logger.info("✅ Index MongoDB créés")


def get_db() -> AsyncIOMotorDatabase:
    """Obtenir l'instance de la base de données."""
    global db
    if db is None:
        raise RuntimeError("Base de données non connectée")
    return db
