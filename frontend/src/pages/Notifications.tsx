import React, { useEffect, useState } from 'react';
import { Card, List, Typography, Tag, Space, Button, Empty, Badge, Tooltip, Modal, Input, DatePicker, Select, message } from 'antd';
import { BellOutlined, CheckCircleOutlined, CloseCircleOutlined, FilterOutlined, DeleteOutlined, EyeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { RangePickerProps } from 'antd/es/date-picker';
import api from '../utils/axios';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;

interface Notification {
  _id: string;
  title: string;
  content: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'hotspot';
  isRead: boolean;
  createdAt: string;
  hotspotId?: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      // 确保 response.data 是数组，如果不是则使用空数组
      const data = Array.isArray(response.data) ? response.data : [];
      setNotifications(data);
    } catch (error) {
      console.error('获取通知失败:', error);
      setNotifications([]); // 出错时设置为空数组
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (_id: string) => {
    try {
      await api.put(`/api/notifications/${_id}/read`, {});

      setNotifications(notifications.map(n =>
        n._id === _id ? { ...n, isRead: true } : n
      ));
      message.success('已标记为已读');
    } catch (error) {
      console.error('标记已读失败:', error);
      message.error('标记已读失败');
    }
  };

  const handleDelete = async (_id: string) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这条通知吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/api/notifications/${_id}`);
          setNotifications(notifications.filter(n => n._id !== _id));
          message.success('删除成功');
        } catch (error) {
          console.error('删除通知失败:', error);
          message.error('删除失败');
        }
      }
    });
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all', {});

      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      message.success('已全部标记为已读');
    } catch (error) {
      console.error('批量标记失败:', error);
      message.error('操作失败');
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.isRead);
    }

    if (dateRange) {
      filtered = filtered.filter(n => {
        const date = dayjs(n.createdAt);
        return date.isAfter(dateRange[0]) && date.isBefore(dateRange[1]);
      });
    }

    return filtered;
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
      case 'warning':
        return <BellOutlined style={{ color: '#faad14', fontSize: 24 }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />;
      default:
        return <BellOutlined style={{ color: '#1890ff', fontSize: 24 }} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#f6ffed';
      case 'warning':
        return '#fff7e6';
      case 'error':
        return '#fff1f0';
      default:
        return '#e6f7ff';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <div className="loader" style={{
          width: 60,
          height: 60,
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #1890ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
      </div>
    );
  }

  const filtered = getFilteredNotifications();
  const unreadCount = getUnreadCount();

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            marginBottom: 24
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white',
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={3} style={{ color: 'white', marginBottom: 0 }}>
                <BellOutlined style={{ marginRight: 8 }} />
                通知中心
                {unreadCount > 0 && (
                  <Badge count={unreadCount} style={{ marginLeft: 16 }}>
                    <span style={{ color: 'white' }}>未读消息</span>
                  </Badge>
                )}
              </Title>

              <Space size="middle">
                <Select
                  value={filter}
                  onChange={(value) => setFilter(value as any)}
                  style={{ width: 120 }}
                >
                  <Select.Option value="all">全部</Select.Option>
                  <Select.Option value="unread">未读</Select.Option>
                  <Select.Option value="read">已读</Select.Option>
                </Select>

                <DatePicker.RangePicker
                  style={{ width: 300 }}
                  onChange={(dates) => setDateRange(dates as [any, any])}
                  placeholder={['开始日期', '结束日期']}
                />

                {unreadCount > 0 && (
                  <Button
                    type="primary"
                    onClick={handleMarkAllRead}
                    style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
                  >
                    全部已读
                  </Button>
                )}
              </Space>
            </div>
          </div>

          {filtered.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text type="secondary">暂无通知</Text>
                  <br />
                  <Text type="secondary">当有新的热点发现时，您会收到通知</Text>
                </div>
              }
            />
          ) : (
            <List
              dataSource={filtered}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '20px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    background: 'white',
                    transition: 'all 0.3s ease',
                    opacity: item.isRead ? 0.6 : 1
                  }}
                  actions={[
                    <Tooltip key="view" title="查看详情">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setSelectedNotification(item);
                          // 查看详情时自动标记为已读
                          if (!item.isRead) {
                            handleMarkRead(item._id);
                          }
                        }}
                        style={{ color: '#1890ff' }}
                      />
                    </Tooltip>,
                    !item.isRead ? (
                      <Tooltip key="read" title="标记已读">
                        <Button
                          type="text"
                          onClick={() => handleMarkRead(item._id)}
                          style={{ color: '#52c41a' }}
                        >
                          标记已读
                        </Button>
                      </Tooltip>
                    ) : (
                      <Tooltip key="delete" title="删除">
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(item._id)}
                          style={{ color: '#ff4d4f' }}
                        />
                      </Tooltip>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 48,
                        height: 48,
                        background: getNotificationColor(item.type),
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getNotificationIcon(item.type)}
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ fontSize: '16px', color: '#333' }}>{item.title}</Text>
                        {!item.isRead && (
                          <Tag color="red" style={{ fontSize: 12 }}>
                            新
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div>
                        <Text type="secondary" style={{ marginBottom: 8 }}>
                          {item.content}
                        </Text>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {new Date(item.createdAt).toLocaleString()}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

      </div>

      <Modal
        title="通知详情"
        open={!!selectedNotification}
        onCancel={() => setSelectedNotification(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedNotification(null)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {selectedNotification && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16, color: '#333' }}>
                {selectedNotification.title}
              </Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: '#666' }}>
                {selectedNotification.content}
              </Text>
            </div>
            <div style={{
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Tag color={selectedNotification.type === 'success' ? 'success' : selectedNotification.type === 'error' ? 'error' : 'processing'}>
                {selectedNotification.type === 'success' ? '成功' : selectedNotification.type === 'error' ? '错误' : '信息'}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(selectedNotification.createdAt).toLocaleString()}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Notifications;