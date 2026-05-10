import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, Select, Space, Typography, message } from "antd";
import { PauseOutlined, CaretRightOutlined, LinkOutlined } from "@ant-design/icons";
import type { PoolName, Prize } from "../types";
import * as api from "../api";

export default function LotteryBoardPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [prizeId, setPrizeId] = useState<number | undefined>();
  const [pool, setPool] = useState<PoolName[]>([]);
  const [display, setDisplay] = useState<{ name: string; department: string } | null>(null);
  const [rolling, setRolling] = useState(false);
  const [winners, setWinners] = useState<{ name: string; department: string; emp_no: string }[] | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const tick = useRef<number | null>(null);

  const refreshPool = useCallback(async () => {
    try {
      const p = await api.poolSample();
      setPool(p);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    api
      .fetchPrizes()
      .then((ps) => {
        setPrizes(ps);
        if (ps.length && prizeId === undefined) {
          setPrizeId(ps[0].id);
        }
      })
      .catch((e) => message.error((e as Error).message));
  }, []);

  useEffect(() => {
    void refreshPool();
    const id = window.setInterval(() => void refreshPool(), 2500);
    return () => window.clearInterval(id);
  }, [refreshPool]);

  useEffect(() => {
    if (!rolling) {
      if (tick.current) window.clearInterval(tick.current);
      tick.current = null;
      return;
    }
    tick.current = window.setInterval(() => {
      if (pool.length === 0) return;
      const i = Math.floor(Math.random() * pool.length);
      setDisplay(pool[i]);
      setWinners(null);
    }, 70);
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
  }, [rolling, pool]);

  const prize = prizes.find((p) => p.id === prizeId);
  const canDraw = prize && prize.drawn_count < prize.total_quantity;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 50% 20%, #173a82 0%, #050913 55%)",
        color: "#fff",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <Space style={{ justifyContent: "space-between", width: "100%", flexWrap: "wrap" }}>
        <Typography.Title level={3} style={{ color: "#ffd666", margin: 0 }}>
          年会抽奖 · 大屏
        </Typography.Title>
        <a href="/admin" style={{ color: "#91caff" }}>
          <LinkOutlined /> 返回后台
        </a>
      </Space>

      <Card
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,214,102,0.35)" }}
        styles={{ body: { padding: 16 } }}
      >
        <Space wrap size="middle">
          <span style={{ color: "#bae0ff" }}>当前奖项</span>
          <Select
            style={{ minWidth: 280 }}
            value={prizeId}
            options={prizes.map((p) => ({
              value: p.id,
              label: `${p.sort_order}. ${p.level_name} — ${p.gift_name}（剩余 ${p.total_quantity - p.drawn_count}/${p.total_quantity}）`,
              disabled: p.drawn_count >= p.total_quantity,
            }))}
            onChange={(v) => {
              setPrizeId(v);
              setWinners(null);
              setRemaining(null);
            }}
          />
          {!rolling ? (
            <Button
              type="primary"
              size="large"
              icon={<CaretRightOutlined />}
              disabled={!canDraw}
              onClick={() => {
                setRolling(true);
                setWinners(null);
              }}
            >
              开始滚动
            </Button>
          ) : (
            <Button
              danger
              size="large"
              type="primary"
              icon={<PauseOutlined />}
              onClick={async () => {
                setRolling(false);
                if (!prizeId) return;
                try {
                  const r = await api.draw(prizeId);
                  setWinners(r.winners.map((w) => ({ name: w.name, department: w.department, emp_no: w.emp_no })));
                  setRemaining(r.remaining_for_prize);
                  setPrizes((prev) => prev.map((p) => (p.id === r.prize.id ? r.prize : p)));
                  setDisplay(null);
                } catch (e) {
                  message.error((e as Error).message);
                }
              }}
            >
              停止并开奖
            </Button>
          )}
        </Space>
        {prize && (
          <Typography.Paragraph style={{ color: "#d3adf7", marginTop: 12, marginBottom: 0 }}>
            本轮最多抽取 {Math.min(prize.per_draw_count, prize.total_quantity - prize.drawn_count)} 人；动画仅作展示，最终结果由服务端随机产生。
          </Typography.Paragraph>
        )}
      </Card>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 280,
          textAlign: "center",
          padding: "24px 12px",
        }}
      >
        {winners && winners.length > 0 ? (
          <div style={{ width: "100%" }}>
            <Typography.Title level={2} style={{ color: "#ffd666", marginBottom: 24 }}>
              恭喜中奖
            </Typography.Title>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {winners.map((w) => (
                <div key={w.emp_no} className="winner-pop">
                  <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1 }}>{w.name}</div>
                  <div style={{ fontSize: 36, color: "#bae0ff", marginTop: 8 }}>{w.department}</div>
                  <div style={{ fontSize: 18, color: "#91caff", marginTop: 8 }}>工号 {w.emp_no}</div>
                </div>
              ))}
            </Space>
            {remaining !== null && (
              <Typography.Paragraph style={{ color: "#d9d9d9", marginTop: 32 }}>
                该奖项剩余名额：{remaining}
              </Typography.Paragraph>
            )}
          </div>
        ) : display && rolling ? (
          <div className="lottery-roll-text">
            <div style={{ fontSize: 64, fontWeight: 750, textShadow: "0 0 24px rgba(255,214,102,0.45)" }}>{display.name}</div>
            <div style={{ fontSize: 36, marginTop: 12, color: "#8dc4ff" }}>{display.department}</div>
          </div>
        ) : (
          <Typography.Text style={{ fontSize: 20, color: "#8c8c8c" }}>选择奖项后点击「开始滚动」，再点「停止并开奖」。</Typography.Text>
        )}
      </div>
    </div>
  );
}
