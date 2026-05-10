import csv
import io
from datetime import datetime
from html import escape

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Prize, WinRecord
from app.schemas import DrawRequest, DrawResult, PoolName, PrizeOut, WinRecordRow
from app.services import lottery_service as ls

router = APIRouter(prefix="/lottery", tags=["lottery"])


def _list_records(db: Session) -> list[WinRecordRow]:
    rows = (
        db.query(WinRecord, Prize)
        .join(Prize, Prize.id == WinRecord.prize_id)
        .order_by(WinRecord.drawn_at.desc(), WinRecord.id.desc())
        .all()
    )
    out: list[WinRecordRow] = []
    for wr, p in rows:
        out.append(
            WinRecordRow(
                emp_no=wr.emp_no,
                name=wr.name,
                department=wr.department,
                level_name=p.level_name,
                gift_name=p.gift_name,
                drawn_at=wr.drawn_at,
            )
        )
    return out


@router.get("/pool-sample", response_model=list[PoolName])
def pool_sample(db: Session = Depends(get_db)) -> list[PoolName]:
    return ls.pool_sample_for_roll(db, limit=100)


@router.post("/draw", response_model=DrawResult)
def draw(body: DrawRequest, db: Session = Depends(get_db)) -> DrawResult:
    try:
        prize, winners = ls.draw_for_prize(db, body.prize_id)
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    if not winners:
        raise HTTPException(400, "本轮未抽中任何人（可能奖池不足）")
    for w in winners:
        db.add(
            WinRecord(
                prize_id=prize.id,
                employee_id=w.id,
                emp_no=w.emp_no,
                name=w.name,
                department=w.department,
                drawn_at=datetime.now(),
            )
        )
    prize.drawn_count = prize.drawn_count + len(winners)
    db.commit()
    db.refresh(prize)
    remaining = prize.total_quantity - prize.drawn_count
    return DrawResult(
        winners=ls.winners_to_schema(winners),
        prize=PrizeOut.model_validate(prize),
        remaining_for_prize=remaining,
    )


@router.get("/records", response_model=list[WinRecordRow])
def records(db: Session = Depends(get_db)) -> list[WinRecordRow]:
    return _list_records(db)


@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db)) -> Response:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["工号", "姓名", "部门", "奖项等级", "奖品", "抽奖时间"])
    for r in _list_records(db):
        w.writerow(
            [
                r.emp_no,
                r.name,
                r.department,
                r.level_name,
                r.gift_name,
                r.drawn_at.strftime("%Y-%m-%d %H:%M:%S"),
            ]
        )
    return PlainTextResponse(
        content="\ufeff" + buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="lottery-winners.csv"'},
    )


@router.get("/export/html")
def export_html(db: Session = Depends(get_db)) -> Response:
    rows = (
        db.query(WinRecord, Prize)
        .join(Prize, Prize.id == WinRecord.prize_id)
        .order_by(Prize.sort_order.asc(), WinRecord.drawn_at.asc())
        .all()
    )
    parts = [
        "<!DOCTYPE html><html><head><meta charset='utf-8'><title>年会中奖名单</title>",
        "<style>body{font-family:Microsoft YaHei,sans-serif;margin:24px;}h1{text-align:center;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #333;padding:8px;text-align:left;}th{background:#f5f5f5;}@media print{.no-print{display:none;}}</style>",
        "</head><body>",
        "<h1>企业年会抽奖 — 中奖名单</h1>",
        "<p class='no-print'>使用浏览器“打印”可保存为 PDF。</p>",
        "<table><thead><tr><th>工号</th><th>姓名</th><th>部门</th><th>奖项</th><th>奖品</th><th>时间</th></tr></thead><tbody>",
    ]
    for wr, p in rows:
        parts.append(
            "<tr>"
            f"<td>{escape(wr.emp_no)}</td>"
            f"<td>{escape(wr.name)}</td>"
            f"<td>{escape(wr.department)}</td>"
            f"<td>{escape(p.level_name)}</td>"
            f"<td>{escape(p.gift_name)}</td>"
            f"<td>{escape(wr.drawn_at.strftime('%Y-%m-%d %H:%M:%S'))}</td>"
            "</tr>"
        )
    parts.append("</tbody></table></body></html>")
    return Response(
        content="".join(parts),
        media_type="text/html; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="lottery-winners.html"'},
    )
