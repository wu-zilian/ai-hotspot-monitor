import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, notification, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SmileOutlined } from '@ant-design/icons';
import api from '../utils/axios';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', values);

      notification.success({
        message: '注册成功',
        description: '请登录您的账号',
      });

      // 重定向到登录页
      window.location.href = '/login';
    } catch (error: any) {
      notification.error({
        message: '注册失败',
        description: error.response?.data?.message || '注册失败，请重试',
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
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
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
            background: 'linear-gradient(45deg, #f093fb, #f5576c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🚀
          </div>
          <Title level={2} style={{ color: '#333' }}>创建新账号</Title>
          <Text type="secondary">加入AI热点监控社区</Text>
        </div>

        <Form
          form={form}
          name="normal_register"
          className="register-form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>

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

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !getFieldValue('password')) {
                    return Promise.resolve();
                  }
                  if (getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'));
                },
              }),
            ]}
          >
            <Input
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="确认密码"
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
                icon={<SmileOutlined />}
              >
                注册
              </Button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text>
                  已有账号？ <a href="/login" style={{ color: '#f5222d' }}>立即登录</a>
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

export default Register;