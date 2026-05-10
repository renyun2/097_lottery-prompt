from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CheckIn, Employee
from app.schemas import CheckInBody, CheckInStatsOut, EmployeeOut

router = APIRouter(prefix="/checkin", tags=["checkin"])


@router.post("", response_model=EmployeeOut)
def check_in(body: CheckInBody, db: Session = Depends(get_db)) -> EmployeeOut:
    no = body.emp_no.strip()
    if not no:
        raise HTTPException(400, "请填写工号")
    e = db.query(Employee).filter(Employee.emp_no == no).one_or_none()
    if e is None:
        raise HTTPException(404, "未找到该工号")
    existing = db.query(CheckIn).filter(CheckIn.employee_id == e.id).one_or_none()
    if existing is None:
        db.add(CheckIn(employee_id=e.id, checked_at=datetime.now()))
        db.commit()
    else:
        existing.checked_at = datetime.now()
        db.commit()
    o = EmployeeOut.model_validate(e)
    o.checked_in = True
    return o


@router.get("/stats", response_model=CheckInStatsOut)
def stats(db: Session = Depends(get_db)) -> CheckInStatsOut:
    total = db.query(Employee).count()
    checked = db.query(CheckIn).count()
    rate = (checked / total) if total else 0.0
    return CheckInStatsOut(total_employees=total, checked_in=checked, rate=round(rate, 4))


@router.get("/list", response_model=list[EmployeeOut])
def list_checked(db: Session = Depends(get_db)) -> list[EmployeeOut]:
    rows = (
        db.query(Employee)
        .join(CheckIn, CheckIn.employee_id == Employee.id)
        .order_by(CheckIn.checked_at.desc())
        .all()
    )
    out: list[EmployeeOut] = []
    for e in rows:
        o = EmployeeOut.model_validate(e)
        o.checked_in = True
        out.append(o)
    return out
