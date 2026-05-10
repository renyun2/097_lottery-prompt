import { useEffect, useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Space, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import type { Prize } from "../types";
import * as api from "../api";

export default function PrizesPage() {
  const [rows, setRows] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Prize | null>(null);
  const [form] = Form.useForm<Prize>();

  const load = () =>
    api
      .fetchPrizes()
      .then(setRows)
      .catch((e) => message.error((e as Error).message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const columns: ColumnsType<Prize> = [
    { title: "顺序", dataIndex: "sort_order", width: 80 },
    { title: "等级", dataIndex: "level_name", width: 120 },
    { title: "奖品", dataIndex: "gift_name" },
    { title: "名额", dataIndex: "total_quantity", width: 90 },
    { title: "每次抽", dataIndex: "per_draw_count", width: 90 },
    { title: "已抽", dataIndex: "drawn_count", width: 80 },
    {
      title: "操作",
      width: 160,
      render: (_, r) => (
        <Space>
          <Typography.Link
            onClick={() => {
              setEdit(r);
              form.setFieldsValue(r);
              setOpen(true);
            }}
          >
            编辑
          </Typography.Link>
          <Typography.Link
            type="danger"
            onClick={async () => {
              try {
                await api.deletePrize(r.id);
                message.success("已删除");
                setLoading(true);
                await load();
              } catch (e) {
                message.error((e as Error).message);
              }
            }}
          >
            删除
          </Typography.Link>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Space style={{ justifyContent: "space-between", width: "100%" }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            奖项设置
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            建议按「顺序」从小到大安排：数值越小越先抽取（例如幸运奖 → 特等奖）。
          </Typography.Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEdit(null);
            form.resetFields();
            form.setFieldsValue({
              sort_order: (rows[rows.length - 1]?.sort_order ?? 0) + 1,
              total_quantity: 1,
              per_draw_count: 1,
            } as Partial<Prize>);
            setOpen(true);
          }}
        >
          新建奖项
        </Button>
      </Space>
      <Table rowKey="id" loading={loading} columns={columns} dataSource={rows} pagination={false} />
      <Modal
        title={edit ? "编辑奖项" : "新建奖项"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (v) => {
            try {
              if (edit) {
                await api.updatePrize(edit.id, v);
              } else {
                await api.createPrize({
                  level_name: v.level_name,
                  gift_name: v.gift_name,
                  sort_order: v.sort_order,
                  total_quantity: v.total_quantity,
                  per_draw_count: v.per_draw_count,
                });
              }
              message.success("已保存");
              setOpen(false);
              setLoading(true);
              await load();
            } catch (e) {
              message.error((e as Error).message);
            }
          }}
        >
          <Form.Item label="顺序（越小越先抽）" name="sort_order" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="等级名称" name="level_name" rules={[{ required: true }]}>
            <Input placeholder="如：一等奖" />
          </Form.Item>
          <Form.Item label="奖品名称" name="gift_name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="总名额" name="total_quantity" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="每次抽取人数" name="per_draw_count" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
