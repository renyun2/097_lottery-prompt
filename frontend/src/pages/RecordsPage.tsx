import { useEffect, useState } from "react";
import { Button, Space, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { WinRecordRow } from "../types";
import * as api from "../api";

export default function RecordsPage() {
  const [rows, setRows] = useState<WinRecordRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api
      .winRecords()
      .then(setRows)
      .catch((e) => message.error((e as Error).message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const columns: ColumnsType<WinRecordRow> = [
    { title: "工号", dataIndex: "emp_no", width: 120 },
    { title: "姓名", dataIndex: "name", width: 120 },
    { title: "部门", dataIndex: "department" },
    { title: "奖项", dataIndex: "level_name", width: 100 },
    { title: "奖品", dataIndex: "gift_name" },
    { title: "时间", dataIndex: "drawn_at", width: 180 },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Space style={{ justifyContent: "space-between", width: "100%", flexWrap: "wrap" }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          中奖记录
        </Typography.Title>
        <Space>
          <Button onClick={() => api.exportUrl("csv")}>导出 CSV</Button>
          <Button type="primary" onClick={() => api.exportUrl("html")}>
            导出可打印 HTML
          </Button>
        </Space>
      </Space>
      <Table rowKey={(r) => `${r.emp_no}-${r.drawn_at}`} loading={loading} columns={columns} dataSource={rows} />
    </Space>
  );
}
