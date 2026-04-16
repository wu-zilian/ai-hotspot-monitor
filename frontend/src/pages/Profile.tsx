import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Avatar, Space, Typography, Descriptions, Spin } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, EditOutlined } from '@ant-design/icons';
import api from '../utils/axios';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      // 先从localStorage获取用户信息
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(localUser);

      // 从后端获取最新用户信息
      const response = await api.get('/api/users/me');
      if (response.data) {
        setUser(response.data);
        profileForm.setFieldsValue({
          username: response.data.username || '',
          email: response.data.email || ''
        });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      // 使用本地存储的用户信息作为后备
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (localUser.username) {
        profileForm.setFieldsValue({
          username: localUser.username || '',
          email: localUser.email || ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    try {
      setUpdating(true);
      const response = await api.put('/api/users/profile', {
        username: values.username
      });

      if (response.data) {
        // 更新本地存储
        const updatedUser = { ...user, ...response.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      message.success('个人信息更新成功');
      setIsEditing(false);
    } catch (error: any) {
      console.error('更新失败:', error);
      message.error(error.response?.data?.message || '更新失败，请重试');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      setChangingPassword(true);
      await api.put('/api/users/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });

      message.success('密码修改成功，请重新登录');
      passwordForm.resetFields();

      // 可选：自动登出让用户重新登录
      // setTimeout(() => {
      //   localStorage.removeItem('token');
      //   localStorage.removeItem('user');
      //   window.location.href = '/login';
      // }, 1500);
    } catch (error: any) {
      console.error('修改密码失败:', error);
      message.error(error.response?.data?.message || '修改失败，请重试');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', background: '#f0f2f5', minHeight: '100vh' }}>
        <Spin size="large" tip="加载用户信息..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* 用户信息卡片 */}
        <Card
          style={{
            marginBottom: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
              <div style={{ flex: 1 }}>
                <Title level={3} style={{ color: 'white', marginBottom: 8 }}>
                  {user?.username || '用户'}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {user?.email || 'user@example.com'}
                </Text>
              </div>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              >
                {isEditing ? '取消编辑' : '编辑资料'}
              </Button>
            </div>
          </div>

          <Descriptions title="账户信息" bordered column={1}>
            <Descriptions.Item label="用户名">
              {user?.username || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="邮箱地址">
              {user?.email || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="用户ID">
              {user?._id || user?.id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {user?.createdAt ? new Date(user.createdAt).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 编辑资料表单 */}
        {isEditing && (
          <Card
            title="编辑个人资料"
            style={{
              marginBottom: '24px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}
          >
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 2, message: '用户名至少2个字符' },
                  { max: 20, message: '用户名最多20个字符' }
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="用户名" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={updating}>
                    保存修改
                  </Button>
                  <Button onClick={() => {
                    setIsEditing(false);
                    profileForm.resetFields();
                  }}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}

        {/* 修改密码卡片 */}
        <Card
          title="修改密码"
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              label="当前密码"
              name="currentPassword"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="当前密码" />
            </Form.Item>

            <Form.Item
              label="新密码"
              name="newPassword"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6位' },
                { max: 50, message: '密码最多50位' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="新密码（至少6位）" />
            </Form.Item>

            <Form.Item
              label="确认密码"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  }
                })
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="再次输入新密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={changingPassword} danger>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
