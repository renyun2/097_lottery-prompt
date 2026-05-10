import json
import random
from datetime import date
from typing import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AppSetting, CheckIn, Employee, Prize, WinRecord
from app.schemas import PoolName, SettingsOut, WinnerOut


def get_setting(db: Session, key: str, default: str) -> str:
    row = db.query(AppSetting).filter(AppSetting.key == key).one_or_none()
    return row.value if row else default


def set_setting(db: Session, key: str, value: str) -> None:
    row = db.query(AppSetting).filter(AppSetting.key == key).one_or_none()
    if row:
        row.value = value
    else:
        db.add(AppSetting(key=key, value=value))


def load_settings(db: Session) -> SettingsOut:
    dept_raw = get_setting(db, "participation_departments", "[]")
    try:
        departments = json.loads(dept_raw)
        if not isinstance(departments, list):
            departments = []
    except json.JSONDecodeError:
        departments = []
    return SettingsOut(
        allow_repeat_win=get_setting(db, "allow_repeat_win", "false").lower() == "true",
        participation_mode=get_setting(db, "participation_mode", "all"),
        participation_departments=[str(x) for x in departments],
        require_checkin=get_setting(db, "require_checkin", "true").lower() == "true",
    )


def tenure_years(hire: date | None, today: date | None = None) -> int:
    if hire is None:
        return 0
    t = today or date.today()
    years = t.year - hire.year
    if (t.month, t.day) < (hire.month, hire.day):
        years -= 1
    return max(0, years)


def effective_weight(emp: Employee) -> int:
    w = max(1, emp.base_weight or 1)
    if tenure_years(emp.hire_date) >= 5:
        w += 1
    return w


def eligible_employee_query(db: Session):
    s = load_settings(db)
    q = db.query(Employee)
    if s.participation_mode == "departments" and s.participation_departments:
        q = q.filter(Employee.department.in_(s.participation_departments))
    if s.require_checkin:
        q = q.join(CheckIn, CheckIn.employee_id == Employee.id)
    if not s.allow_repeat_win:
        won_sq = select(WinRecord.employee_id).distinct()
        q = q.filter(~Employee.id.in_(won_sq))
    return q


def list_eligible_employees(db: Session) -> list[Employee]:
    return eligible_employee_query(db).all()


def weighted_draw(employees: Iterable[Employee], n: int) -> list[Employee]:
    emps = list(employees)
    if not emps or n <= 0:
        return []
    tickets: list[int] = []
    for e in emps:
        tickets.extend([e.id] * effective_weight(e))
    random.shuffle(tickets)
    picked: list[Employee] = []
    seen: set[int] = set()
    id_map = {e.id: e for e in emps}
    for eid in tickets:
        if eid in seen:
            continue
        if eid not in id_map:
            continue
        seen.add(eid)
        picked.append(id_map[eid])
        if len(picked) >= n:
            break
    return picked


def draw_for_prize(db: Session, prize_id: int) -> tuple[Prize, list[Employee]]:
    prize = db.query(Prize).filter(Prize.id == prize_id).one_or_none()
    if prize is None:
        raise ValueError("奖项不存在")
    remaining = prize.total_quantity - prize.drawn_count
    if remaining <= 0:
        raise ValueError("该奖项已无剩余名额")
    n = min(prize.per_draw_count, remaining)
    pool = list_eligible_employees(db)
    if not pool:
        raise ValueError("当前无符合条件的参与人员（检查签到、部门范围及是否允许重复中奖）")
    winners = weighted_draw(pool, n)
    return prize, winners


def pool_sample_for_roll(db: Session, limit: int = 80) -> list[PoolName]:
    pool = list_eligible_employees(db)
    if not pool:
        return []
    sample_k = min(limit, len(pool))
    picked = random.sample(pool, k=sample_k)
    return [PoolName(name=e.name, department=e.department) for e in picked]


def winners_to_schema(emps: list[Employee]) -> list[WinnerOut]:
    return [WinnerOut.model_validate(e) for e in emps]
