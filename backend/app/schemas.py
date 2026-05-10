from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class SettingsOut(BaseModel):
    allow_repeat_win: bool
    participation_mode: str  # all | departments
    participation_departments: list[str]
    require_checkin: bool


class SettingsUpdate(BaseModel):
    allow_repeat_win: bool | None = None
    participation_mode: Literal["all", "departments"] | None = None
    participation_departments: list[str] | None = None
    require_checkin: bool | None = None


class EmployeeOut(BaseModel):
    id: int
    emp_no: str
    name: str
    department: str
    hire_date: date | None
    base_weight: int
    checked_in: bool = False

    model_config = {"from_attributes": True}


class PrizeOut(BaseModel):
    id: int
    level_name: str
    gift_name: str
    sort_order: int
    total_quantity: int
    per_draw_count: int
    drawn_count: int

    model_config = {"from_attributes": True}


class PrizeCreate(BaseModel):
    level_name: str
    gift_name: str
    sort_order: int
    total_quantity: int = Field(ge=1)
    per_draw_count: int = Field(ge=1)


class PrizeUpdate(BaseModel):
    level_name: str | None = None
    gift_name: str | None = None
    sort_order: int | None = None
    total_quantity: int | None = Field(default=None, ge=1)
    per_draw_count: int | None = Field(default=None, ge=1)


class CheckInBody(BaseModel):
    emp_no: str


class CheckInStatsOut(BaseModel):
    total_employees: int
    checked_in: int
    rate: float


class DrawRequest(BaseModel):
    prize_id: int


class WinnerOut(BaseModel):
    id: int
    emp_no: str
    name: str
    department: str

    model_config = {"from_attributes": True}


class DrawResult(BaseModel):
    winners: list[WinnerOut]
    prize: PrizeOut
    remaining_for_prize: int


class WinRecordRow(BaseModel):
    emp_no: str
    name: str
    department: str
    level_name: str
    gift_name: str
    drawn_at: datetime


class PoolName(BaseModel):
    name: str
    department: str
