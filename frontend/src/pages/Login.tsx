import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, notification } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import api from '../utils/axios';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', values);

      // 存储token到localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // 显示成功通知
      notification.success({
        message: '登录成功',
        description: '欢迎回来！',
      });

      // 重定向到首页
      window.location.href = '/';
    } catch (error: any) {
      notification.error({
        message: '登录失败',
        description: error.response?.data?.message || '用户名或密码错误',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card
        style={{
          width: 400,
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16,
            background: 'linear-gradient(45deg, #1890ff, #52c41a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🔥
          </div>
          <Title level={2} style={{ color: '#333' }}>AI Hotspot Monitor</Title>
          <Text type="secondary">智能热点监控，让您走在科技前沿</Text>
        </div>

        <Form
          form={form}
          name="normal_login"
          className="login-form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱!' }]}
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" />}
              placeholder="邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ width: '100%', height: 48, fontSize: 16 }}
                icon={<UserOutlined />}
              >
                登录
              </Button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text>
                  还没有账号？ <a href="/register" style={{ color: '#1890ff' }}>立即注册</a>
                </Text>
              </div>
            </Space>
          </Form.Item>
        </Form>

        <div style={{
          marginTop: 24,
          padding: '16px 0',
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center'
        }}>
          <Text type="secondary">
            使用 AI 技术智能分析热点，7×24 小时监控科技动态
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;