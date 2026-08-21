from fastapi import APIRouter, Depends, HTTPException, status

from app import notificari_utils
from app.db import run_select_one
from app.routers.auth import get_current_user

router = APIRouter(prefix="/notificari", tags=["notificari"])

def client_context(user=Depends(get_current_user)):
    row = run_select_one(
        "SELECT id_client FROM client WHERE id_utilizator = ?",(user["id_utilizator"],), dictionary=True,)
    if not row:
        raise HTTPException( status.HTTP_403_FORBIDDEN,"Contul nu are profil de client",)
    return {
        "id_utilizator": user["id_utilizator"],
        "id_client": row["id_client"],
    }

@router.get("")
def list_notifications(context=Depends(client_context)):
    seen_at = notificari_utils.get_seen_at(context["id_utilizator"])

    return {"necitite": notificari_utils.count_unread(context["id_client"],seen_at,),
            "notificari": notificari_utils.load_notifications(context["id_client"], seen_at,),
    }

@router.get("/necitite")
def unread_count(context=Depends(client_context)):
    seen_at = notificari_utils.get_seen_at(context["id_utilizator"])
    return {
        "necitite": notificari_utils.count_unread(
            context["id_client"],
            seen_at,
        ),
    }

@router.post("/vazute")
def mark_seen(context=Depends(client_context)):
    notificari_utils.mark_seen(context["id_utilizator"])

    return {"detail": "Notificari marcate ca citite"}