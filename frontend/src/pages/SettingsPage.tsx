import { useEffect, useState } from "react";
import { Button, Card, Form, Select, Switch, Typography, message } from "antd";
import type { AppSettings } from "../types";
import * as api from "../api";

export default function SettingsPage() {
  const [form] = Form.useForm<AppSettings>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const s = await api.fetchSettings();
        if (!ok) return;
        form.setFieldsValue(s);
      } catch (e) {
        message.error((e as Error).message);
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, [form]);

  const [depts, setDepts] = useState<string[]>([]);
  useEffect(() => {
    api.fetchDepartments().then(setDepts).catch(() => {});
  }, []);

  const mode = Form.useWatch("participation_mode", form);

  return (
      <Card title="抽奖规则与参与范围" loading={loading}>
        <Typography.Paragraph type="secondary">
          权重规则：每位员工可按 CSV「权重」叠加基础机会；入职满 5 年系统自动额外 +1 次机会（与业务描述一致）。
        </Typography.Paragraph>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (v: AppSettings) => {
            try {
              await api.saveSettings(v);
              message.success("已保存");
            } catch (e) {
              message.error((e as Error).message);
            }
          }}
        >
          <Form.Item label="必须签到后才能参与" name="require_checkin" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="允许同一人多次中奖" name="allow_repeat_win" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="参与范围" name="participation_mode">
            <Select
              options={[
                { value: "all", label: "全体员工（在导入名单内）" },
                { value: "departments", label: "仅指定部门" },
              ]}
            />
          </Form.Item>
          {mode === "departments" && (
            <Form.Item label="选择的部门" name="participation_departments">
              <Select mode="multiple" allowClear options={depts.map((d) => ({ value: d, label: d }))} placeholder="选择可参与部门" />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
  );
}
