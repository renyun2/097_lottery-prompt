import { useEffect, useState } from "react";
import { Card, Col, Form, Input, Row, Space, Statistic, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { CheckInStats, Employee } from "../types";
import * as api from "../api";

export default function CheckinPage() {
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [list, setList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm<{ emp_no: string }>();

  const refresh = async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([api.checkInStats(), api.checkInList()]);
      setStats(s);
      setList(l);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const columns: ColumnsType<Employee> = [
    { title: "工号", dataIndex: "emp_no", width: 120 },
    { title: "姓名", dataIndex: "name", width: 140 },
    { title: "部门", dataIndex: "department" },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        签到
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        活动开始前可扫描物料码跳转到本页，或直接输入工号签到；开启「必须签到」后仅签到人员进入奖池。
      </Typography.Paragraph>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="应到人数" value={stats?.total_employees ?? "—"} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="已签到" value={stats?.checked_in ?? "—"} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="签到率"
              value={stats ? `${(stats.rate * 100).toFixed(1)}%` : "—"}
            />
          </Card>
        </Col>
      </Row>
      <Card title="输入工号签到">
        <Form
          form={form}
          layout="inline"
          onFinish={async (v) => {
            try {
              await api.checkIn(v.emp_no.trim());
              message.success("签到成功");
              form.resetFields();
              await refresh();
            } catch (e) {
              message.error((e as Error).message);
            }
          }}
        >
          <Form.Item name="emp_no" rules={[{ required: true, message: "请输入工号" }]}>
            <Input placeholder="工号" style={{ width: 220 }} />
          </Form.Item>
          <Form.Item>
            <Typography.Link onClick={() => form.submit()}>提交签到</Typography.Link>
          </Form.Item>
        </Form>
      </Card>
      <Card title="最近签到">
        <Table rowKey="id" size="small" loading={loading} dataSource={list} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
    </Space>
  );
}
