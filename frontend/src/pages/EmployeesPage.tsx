import { useEffect, useState } from "react";
import { Button, Popconfirm, Space, Table, Upload, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { UploadOutlined } from "@ant-design/icons";
import type { Employee } from "../types";
import * as api from "../api";

export default function EmployeesPage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api
      .fetchEmployees()
      .then(setRows)
      .catch((e) => message.error((e as Error).message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const columns: ColumnsType<Employee> = [
    { title: "工号", dataIndex: "emp_no", width: 120 },
    { title: "姓名", dataIndex: "name", width: 140 },
    { title: "部门", dataIndex: "department" },
    { title: "入职日期", dataIndex: "hire_date", width: 140, render: (v) => v || "—" },
    { title: "基础权重", dataIndex: "base_weight", width: 100 },
    {
      title: "签到",
      dataIndex: "checked_in",
      width: 90,
      render: (v: boolean) => (v ? "已签到" : "未签到"),
    },
    {
      title: "操作",
      width: 100,
      render: (_, r) => (
        <Popconfirm title="确定删除？" onConfirm={() => api.deleteEmployee(r.id).then(load)}>
          <Button type="link" danger size="small">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Typography.Title level={4} style={{ margin: 0 }}>
        参与人员
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
        CSV 列：<Typography.Text code>工号</Typography.Text>、<Typography.Text code>姓名</Typography.Text>、
        <Typography.Text code>部门</Typography.Text>；可选 <Typography.Text code>入职日期</Typography.Text>、
        <Typography.Text code>权重</Typography.Text>（正整数，默认 1）。
      </Typography.Paragraph>
      <Upload
        accept=".csv"
        showUploadList={false}
        beforeUpload={async (file) => {
          setLoading(true);
          try {
            const r = await api.importEmployeesCsv(file);
            message.success(`导入完成：新增 ${r.added}，更新 ${r.updated}`);
            await load();
          } catch (e) {
            message.error((e as Error).message);
            setLoading(false);
          }
          return false;
        }}
      >
        <Button icon={<UploadOutlined />} type="primary">
          导入 CSV
        </Button>
      </Upload>
      <Table rowKey="id" loading={loading} columns={columns} dataSource={rows} pagination={{ pageSize: 15 }} />
    </Space>
  );
}
