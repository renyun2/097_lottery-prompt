import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import SettingsOut, SettingsUpdate
from app.services import lottery_service as ls

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db)) -> SettingsOut:
    return ls.load_settings(db)


@router.put("", response_model=SettingsOut)
def update_settings(body: SettingsUpdate, db: Session = Depends(get_db)) -> SettingsOut:
    if body.allow_repeat_win is not None:
        ls.set_setting(db, "allow_repeat_win", "true" if body.allow_repeat_win else "false")
    if body.participation_mode is not None:
        ls.set_setting(db, "participation_mode", body.participation_mode)
    if body.participation_departments is not None:
        ls.set_setting(db, "participation_departments", json.dumps(body.participation_departments, ensure_ascii=False))
    if body.require_checkin is not None:
        ls.set_setting(db, "require_checkin", "true" if body.require_checkin else "false")
    db.commit()
    return ls.load_settings(db)
