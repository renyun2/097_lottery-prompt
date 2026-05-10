import csv
import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CheckIn, Employee, WinRecord
from app.schemas import EmployeeOut

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("", response_model=list[EmployeeOut])
def list_employees(db: Session = Depends(get_db)) -> list[EmployeeOut]:
    rows = db.query(Employee).order_by(Employee.emp_no).all()
    checked_ids = {r.employee_id for r in db.query(CheckIn.employee_id).all()}
    out: list[EmployeeOut] = []
    for e in rows:
        o = EmployeeOut.model_validate(e)
        o.checked_in = e.id in checked_ids
        out.append(o)
    return out


@router.delete("/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db)) -> dict[str, str]:
    e = db.query(Employee).filter(Employee.id == emp_id).one_or_none()
    if e is None:
        raise HTTPException(404, "员工不存在")
    db.query(WinRecord).filter(WinRecord.employee_id == emp_id).delete()
    db.query(CheckIn).filter(CheckIn.employee_id == emp_id).delete()
    db.delete(e)
    db.commit()
    return {"ok": "true"}


@router.post("/import")
async def import_csv(file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict[str, int]:
    raw = await file.read()
    text = raw.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    required = {"工号", "姓名", "部门"}
    if not reader.fieldnames or not required.issubset(set(reader.fieldnames)):
        raise HTTPException(400, "CSV 须包含列：工号, 姓名, 部门；可选：入职日期, 权重")
    added = 0
    updated = 0
    for row in reader:
        emp_no = (row.get("工号") or "").strip()
        name = (row.get("姓名") or "").strip()
        dept = (row.get("部门") or "").strip()
        if not emp_no or not name:
            continue
        hire_raw = (row.get("入职日期") or row.get("hire_date") or "").strip()
        hire = None
        if hire_raw:
            from datetime import datetime

            for fmt in ("%Y-%m-%d", "%Y/%m/%d"):
                try:
                    hire = datetime.strptime(hire_raw[:10], fmt).date()
                    break
                except ValueError:
                    continue
        w = 1
        wr = (row.get("权重") or row.get("weight") or "").strip()
        if wr.isdigit():
            w = max(1, int(wr))
        existing = db.query(Employee).filter(Employee.emp_no == emp_no).one_or_none()
        if existing:
            existing.name = name
            existing.department = dept or existing.department
            existing.hire_date = hire if hire is not None else existing.hire_date
            existing.base_weight = w
            updated += 1
        else:
            db.add(
                Employee(
                    emp_no=emp_no,
                    name=name,
                    department=dept or "未分配",
                    hire_date=hire,
                    base_weight=w,
                )
            )
            added += 1
    db.commit()
    return {"added": added, "updated": updated}


@router.get("/departments", response_model=list[str])
def list_departments(db: Session = Depends(get_db)) -> list[str]:
    rows = db.query(Employee.department, func.count(Employee.id)).group_by(Employee.department).all()
    return sorted({r[0] for r in rows if r[0]})
