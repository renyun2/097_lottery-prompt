import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout, Menu, Typography } from "antd";
import {
  GiftOutlined,
  SettingOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  UnorderedListOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import SettingsPage from "./pages/SettingsPage";
import EmployeesPage from "./pages/EmployeesPage";
import PrizesPage from "./pages/PrizesPage";
import CheckinPage from "./pages/CheckinPage";
import RecordsPage from "./pages/RecordsPage";
import LotteryBoardPage from "./pages/LotteryBoardPage";

const { Header, Content } = Layout;

function AdminShell() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, "");
  const selected =
    path.endsWith("/settings") || path.endsWith("/admin")
      ? "settings"
      : path.endsWith("/employees")
        ? "employees"
        : path.endsWith("/prizes")
          ? "prizes"
          : path.endsWith("/checkin")
            ? "checkin"
            : path.endsWith("/records")
              ? "records"
              : "settings";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingInline: 16,
          background: "#001529",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Typography.Title level={4} style={{ color: "#fff", margin: 0, whiteSpace: "nowrap" }}>
          企业年会抽奖管理
        </Typography.Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selected]}
          style={{ flex: 1, minWidth: 280, border: "none" }}
          items={[
            { key: "settings", icon: <SettingOutlined />, label: <Link to="/admin/settings">规则与范围</Link> },
            { key: "employees", icon: <TeamOutlined />, label: <Link to="/admin/employees">参与人员</Link> },
            { key: "prizes", icon: <GiftOutlined />, label: <Link to="/admin/prizes">奖项设置</Link> },
            { key: "checkin", icon: <LoginOutlined />, label: <Link to="/admin/checkin">签到</Link> },
            { key: "records", icon: <UnorderedListOutlined />, label: <Link to="/admin/records">中奖记录</Link> },
          ]}
        />
        <Link to="/display" target="_blank" rel="noreferrer" style={{ color: "#ffd666", whiteSpace: "nowrap" }}>
          <PlayCircleOutlined /> 打开抽奖大屏
        </Link>
      </Header>
      <Content style={{ padding: 24 }}>
        <Routes>
          <Route path="settings" element={<SettingsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="prizes" element={<PrizesPage />} />
          <Route path="checkin" element={<CheckinPage />} />
          <Route path="records" element={<RecordsPage />} />
          <Route path="" element={<Navigate to="/admin/settings" replace />} />
        </Routes>
      </Content>
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminShell />} />
      <Route path="/display" element={<LotteryBoardPage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
