import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Typography, message } from 'antd';
import {
  HomeOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  ProfileOutlined
} from '@ant-design/icons';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Keywords from './pages/Keywords';
import History from './pages/History';
import NotificationDropdown from './components/NotificationDropdown';
import api from './utils/axios';

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;

// 内容组件 - 在 Router 内部使用
function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // 初始化时直接检查 localStorage，避免页面刷新后被重定向到登录页
    return !!localStorage.getItem('token');
  });
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 根据当前路径设置选中菜单
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') setSelectedMenu('dashboard');
    else if (path === '/keywords') setSelectedMenu('keywords');
    else if (path === '/history') setSelectedMenu('history');
    else if (path === '/notifications') setSelectedMenu('notifications');
    else if (path === '/settings') setSelectedMenu('settings');
    else if (path === '/profile') setSelectedMenu('profile');
    else setSelectedMenu('');
  }, [location.pathname]);

  const handleMenuClick = (key: string) => {
    setSelectedMenu(key);
    navigate('/' + (key === 'dashboard' ? '' : key));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/login');
  };

  // 登录/注册页面 - 独立布局
  if (location.pathname === '/login' || location.pathname === '/register') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // 如果用户未登录，重定向到登录页
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // 导航菜单项
  const menuItems = [
    { key: 'dashboard', label: '仪表板', icon: <HomeOutlined /> },
    { key: 'keywords', label: '关键词管理', icon: <ThunderboltOutlined /> },
    { key: 'history', label: '历史记录', icon: <HistoryOutlined /> },
    { key: 'notifications', label: '通知中心', icon: <BellOutlined /> },
    { key: 'settings', label: '系统设置', icon: <SettingOutlined /> },
    { key: 'profile', label: '个人中心', icon: <ProfileOutlined /> },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginRight: '24px',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            🔥 AI热点监控
          </div>

          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[selectedMenu]}
            style={{ background: 'transparent', flex: 1 }}
            onClick={({ key }) => handleMenuClick(key)}
            items={menuItems.map(item => ({
              key: item.key,
              label: item.label,
              icon: item.icon,
            }))}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* 通知中心下拉 */}
          {isLoggedIn && (
            <NotificationDropdown
              onNotificationClick={(notification) => {
                // 点击通知后跳转到通知中心
                navigate('/notifications');
              }}
            />
          )}

          <Dropdown
            menu={{
              items: [
                {
                  key: 'profile',
                  label: '个人中心',
                  icon: <ProfileOutlined />,
                  onClick: () => handleMenuClick('profile'),
                },
                {
                  key: 'settings',
                  label: '系统设置',
                  icon: <SettingOutlined />,
                  onClick: () => handleMenuClick('settings'),
                },
                {
                  type: 'divider',
                },
                {
                  key: 'logout',
                  label: '退出登录',
                  icon: <LogoutOutlined />,
                  onClick: handleLogout,
                  danger: true,
                },
              ],
            }}
            placement="bottomRight"
          >
            <Button
              type="text"
              style={{
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Avatar style={{ backgroundColor: '#87d068' }}>
                U
              </Avatar>
              <Text style={{ color: 'white', fontWeight: 500 }}>
                {JSON.parse(localStorage.getItem('user') || '{}')?.username || '用户'}
              </Text>
            </Button>
          </Dropdown>
        </div>
      </Header>

        <Layout>
          <Content style={{ background: '#f5f5f5', marginTop: 0 }}>
            <div style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/keywords" element={<Keywords />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </div>
          </Content>
        </Layout>

        <Footer style={{ textAlign: 'center', background: '#fafafa', padding: '16px 0' }}>
          <Text type="secondary">
            🔥 AI 热点监控 ©2024 | 让您走在科技前沿
          </Text>
        </Footer>
      </Layout>
  );
}

// 主应用组件 - 提供 Router 上下文
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;