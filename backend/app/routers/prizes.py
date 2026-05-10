from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Prize, WinRecord
from app.schemas import PrizeCreate, PrizeOut, PrizeUpdate

router = APIRouter(prefix="/prizes", tags=["prizes"])


@router.get("", response_model=list[PrizeOut])
def list_prizes(db: Session = Depends(get_db)) -> list[PrizeOut]:
    rows = db.query(Prize).order_by(Prize.sort_order.asc(), Prize.id.asc()).all()
    return [PrizeOut.model_validate(r) for r in rows]


@router.post("", response_model=PrizeOut)
def create_prize(body: PrizeCreate, db: Session = Depends(get_db)) -> PrizeOut:
    p = Prize(
        level_name=body.level_name,
        gift_name=body.gift_name,
        sort_order=body.sort_order,
        total_quantity=body.total_quantity,
        per_draw_count=body.per_draw_count,
        drawn_count=0,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return PrizeOut.model_validate(p)


@router.put("/{prize_id}", response_model=PrizeOut)
def update_prize(prize_id: int, body: PrizeUpdate, db: Session = Depends(get_db)) -> PrizeOut:
    p = db.query(Prize).filter(Prize.id == prize_id).one_or_none()
    if p is None:
        raise HTTPException(404, "奖项不存在")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(p, k, v)
    if p.drawn_count > p.total_quantity:
        raise HTTPException(400, "已抽取数量不能大于总名额")
    db.commit()
    db.refresh(p)
    return PrizeOut.model_validate(p)


@router.delete("/{prize_id}")
def delete_prize(prize_id: int, db: Session = Depends(get_db)) -> dict[str, str]:
    p = db.query(Prize).filter(Prize.id == prize_id).one_or_none()
    if p is None:
        raise HTTPException(404, "奖项不存在")
    db.query(WinRecord).filter(WinRecord.prize_id == prize_id).delete()
    db.delete(p)
    db.commit()
    return {"ok": "true"}
