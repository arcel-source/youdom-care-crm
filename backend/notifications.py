"""Module notifications internes — Youdom Care CRM."""
import logging
from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query, status

from database import get_db
from auth import require_permission
from models import NotificationCreate, NotificationResponse, TypeNotification
from utils import serialize_doc

logger = logging.getLogger(__name__)
router = APIRouter()


def format_notification(doc: dict) -> dict:
    return serialize_doc(doc) if doc else None


# ============================================================
# Helper global — utilisable depuis tous les modules
# ============================================================

async def create_notification(
    user_id: str,
    type_notification: TypeNotification,
    titre: str,
    message: str,
    lien: Optional[str] = None,
    data: Optional[dict] = None,
) -> dict:
    """Créer une notification interne (helper appelable depuis n'importe quel module)."""
    db = get_db()
    now = datetime.utcnow()
    doc = {
        "user_id": user_id,
        "type_notification": type_notification.value if hasattr(type_notification, "value") else type_notification,
        "titre": titre[:200],
        "message": message[:1000],
        "lien": lien,
        "data": data or {},
        "lu": False,
        "created_at": now,
    }
    result = await db.notifications.insert_one(doc)
    doc["_id"] = result.inserted_id
    return format_notification(doc)


# ============================================================
# Endpoints
# ============================================================

@router.get("", summary="Mes notifications")
async def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    non_lues_seulement: bool = Query(False),
    current_user: dict = Depends(require_permission("dashboard:read"))
):
    """Récupérer les notifications de l'utilisateur courant."""
    db = get_db()
    query = {"user_id": current_user["id"]}
    if non_lues_seulement:
        query["lu"] = False

    total = await db.notifications.count_documents(query)
    skip = (page - 1) * limit
    docs = await db.notifications.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)

    return {
        "items": [format_notification(d) for d in docs],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0,
    }


@router.get("/non-lues/count", summary="Nombre de notifications non lues")
async def count_unread(
    current_user: dict = Depends(require_permission("dashboard:read"))
):
    """Retourner le nombre de notifications non lues."""
    db = get_db()
    count = await db.notifications.count_documents({
        "user_id": current_user["id"],
        "lu": False,
    })
    return {"non_lues": count}


@router.post("", summary="Créer une notification (admin)")
async def create_notification_endpoint(
    data: NotificationCreate,
    current_user: dict = Depends(require_permission("admin"))
):
    """Créer une notification manuellement (usage admin/test)."""
    notif = await create_notification(
        user_id=data.user_id,
        type_notification=data.type_notification,
        titre=data.titre,
        message=data.message,
        lien=data.lien,
        data=data.data,
    )
    return notif


@router.patch("/{notification_id}/lire", summary="Marquer comme lue")
async def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(require_permission("dashboard:read"))
):
    """Marquer une notification comme lue."""
    db = get_db()
    try:
        oid = ObjectId(notification_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID notification invalide")

    result = await db.notifications.update_one(
        {"_id": oid, "user_id": current_user["id"]},
        {"$set": {"lu": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    return {"message": "Notification marquée comme lue"}


@router.patch("/lire-tout", summary="Tout marquer comme lu")
async def mark_all_read(
    current_user: dict = Depends(require_permission("dashboard:read"))
):
    """Marquer toutes les notifications comme lues."""
    db = get_db()
    result = await db.notifications.update_many(
        {"user_id": current_user["id"], "lu": False},
        {"$set": {"lu": True}}
    )
    return {"message": f"{result.modified_count} notification(s) marquée(s) comme lues"}


@router.delete("/{notification_id}", summary="Supprimer une notification")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(require_permission("dashboard:read"))
):
    """Supprimer une notification."""
    db = get_db()
    try:
        oid = ObjectId(notification_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID notification invalide")

    result = await db.notifications.delete_one(
        {"_id": oid, "user_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    return {"message": "Notification supprimée"}


@router.delete("", summary="Vider toutes mes notifications")
async def delete_all_notifications(
    current_user: dict = Depends(require_permission("dashboard:read"))
):
    """Supprimer toutes les notifications de l'utilisateur courant."""
    db = get_db()
    result = await db.notifications.delete_many({"user_id": current_user["id"]})
    return {"message": f"{result.deleted_count} notification(s) supprimée(s)"}
