from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    emp_no: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    department: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    hire_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    base_weight: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    check_in: Mapped["CheckIn | None"] = relationship(back_populates="employee", uselist=False)
    win_records: Mapped[list["WinRecord"]] = relationship(back_populates="employee")


class Prize(Base):
    __tablename__ = "prizes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    level_name: Mapped[str] = mapped_column(String(64), nullable=False)
    gift_name: Mapped[str] = mapped_column(String(128), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    total_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    per_draw_count: Mapped[int] = mapped_column(Integer, nullable=False)
    drawn_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    win_records: Mapped[list["WinRecord"]] = relationship(back_populates="prize")


class CheckIn(Base):
    __tablename__ = "check_ins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), unique=True, nullable=False)
    checked_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    employee: Mapped[Employee] = relationship(back_populates="check_in")


class AppSetting(Base):
    __tablename__ = "app_settings"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)


class WinRecord(Base):
    __tablename__ = "win_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    prize_id: Mapped[int] = mapped_column(ForeignKey("prizes.id"), nullable=False, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    emp_no: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    department: Mapped[str] = mapped_column(String(128), nullable=False)
    drawn_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    prize: Mapped[Prize] = relationship(back_populates="win_records")
    employee: Mapped[Employee] = relationship(back_populates="win_records")
