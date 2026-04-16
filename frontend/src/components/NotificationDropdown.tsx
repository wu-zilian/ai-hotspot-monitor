import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Typography, Button, Empty, Tag, Spin, Divider } from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  FireOutlined
} from '@ant-design/icons';
import api from '../utils/axios';

const { Text } = Typography;

interface Notification {
  _id: string;
  title: string;
  content: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'hotspot';
  isRead: boolean;
  createdAt: string;
  hotspotId?: string;
}

interface NotificationDropdownProps {
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNotificationClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  // 获取通知列表
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/notifications');
      const data = Array.isArray(response.data) ? response.data : [];
      setNotifications(data.slice(0, 5)); // 只显示最近5条
      setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 标记单个通知为已读
  const handleMarkRead = async (_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.put(`/api/notifications/${_id}/read`);
      setNotifications(notifications.map(n =>
        n._id === _id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 标记所有通知为已读
  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('批量标记失败:', error);
    }
  };

  // 删除通知
  const handleDelete = async (_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${_id}`);
      const updated = notifications.filter(n => n._id !== _id);
      setNotifications(updated);
      if (!notifications.find(n => n._id === _id)?.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  };

  // 点击通知项
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      setNotifications(notifications.map(n =>
        n._id === notification._id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setOpen(false);
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchNotifications();
  }, []);

  // 每30秒刷新一次通知
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);

    // 监听通知刷新事件
    const handleRefresh = () => {
      console.log('收到通知刷新事件，刷新通知列表');
      fetchNotifications();
    };

    window.addEventListener('notification-refresh', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-refresh', handleRefresh);
    };
  }, []);

  const getNotificationIcon = (type: string) => {
    const iconStyle = { fontSize: 16 };
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case 'warning':
        return <WarningOutlined style={{ ...iconStyle, color: '#faad14' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
      case 'hotspot':
        return <FireOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
      default:
        return <InfoCircleOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
    }
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'transparent';
    switch (type) {
      case 'success':
        return 'rgba(82, 196, 26, 0.06)';
      case 'warning':
        return 'rgba(250, 173, 20, 0.06)';
      case 'error':
        return 'rgba(255, 77, 79, 0.06)';
      case 'hotspot':
        return 'rgba(255, 77, 79, 0.06)';
      default:
        return 'rgba(24, 144, 255, 0.06)';
    }
  };

  const getNotificationBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#52c41a';
      case 'warning':
        return '#faad14';
      case 'error':
        return '#ff4d4f';
      case 'hotspot':
        return '#ff4d4f';
      default:
        return '#1890ff';
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };

  const notificationContent = (
    <div style={{
      width: 400,
      maxHeight: 520,
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12)',
      overflow: 'hidden'
    }}>
      {/* 顶部标题栏 */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BellOutlined style={{ color: 'white', fontSize: 18 }} />
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: 600,
            margin: 0
          }}>
            通知中心
          </Text>
          {unreadCount > 0 && (
            <Badge
              count={unreadCount}
              style={{
                backgroundColor: '#fff',
                color: '#667eea',
                fontSize: 12,
                fontWeight: 'bold',
                boxShadow: 'none'
              }}
            />
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            type="text"
            size="small"
            onClick={handleMarkAllRead}
            style={{
              color: 'white',
              fontSize: 13,
              padding: '4px 12px',
              height: 'auto',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)'
            }}
          >
            全部已读
          </Button>
        )}
      </div>

      {/* 通知列表 */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            imageStyle={{ height: 60 }}
            description={
              <Text type="secondary" style={{ fontSize: 14 }}>
                暂无通知
              </Text>
            }
          />
        </div>
      ) : (
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          <List
            dataSource={notifications}
            renderItem={(item, index) => (
              <div key={item._id}>
                <div
                  style={{
                    padding: '14px 20px',
                    cursor: 'pointer',
                    background: getNotificationBgColor(item.type, item.isRead),
                    borderLeft: item.isRead ? '3px solid transparent' : `3px solid ${getNotificationBorderColor(item.type)}`,
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onClick={() => handleNotificationClick(item)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = item.isRead
                      ? 'rgba(24, 144, 255, 0.04)'
                      : getNotificationBgColor(item.type, true);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = getNotificationBgColor(item.type, item.isRead);
                  }}
                >
                  {/* 未读红点 */}
                  {!item.isRead && (
                    <div style={{
                      position: 'absolute',
                      top: 18,
                      right: 60,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#ff4d4f',
                      boxShadow: '0 0 0 2px rgba(255, 77, 79, 0.2)'
                    }} />
                  )}

                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {/* 图标 */}
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      backgroundColor: item.isRead ? '#f5f5f5' : getNotificationBorderColor(item.type) + '15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      {getNotificationIcon(item.type)}
                    </div>

                    {/* 内容 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 4,
                        gap: 8
                      }}>
                        <Text
                          strong={!item.isRead}
                          style={{
                            fontSize: 14,
                            color: item.isRead ? '#8c8c8c' : '#262626',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>
                          {formatTime(item.createdAt)}
                        </Text>
                      </div>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 13,
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: item.isRead ? '#bfbfbf' : '#8c8c8c'
                        }}
                      >
                        {item.content}
                      </Text>
                    </div>

                    {/* 操作按钮 */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      opacity: 0,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0';
                    }}
                    >
                      {!item.isRead && (
                        <Button
                          type="text"
                          size="small"
                          icon={<CheckOutlined />}
                          onClick={(e) => handleMarkRead(item._id, e)}
                          style={{
                            color: '#52c41a',
                            padding: 0,
                            width: 28,
                            height: 28
                          }}
                        />
                      )}
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => handleDelete(item._id, e)}
                        style={{
                          color: '#ff4d4f',
                          padding: 0,
                          width: 28,
                          height: 28
                        }}
                      />
                    </div>
                  </div>
                </div>
                {index < notifications.length - 1 && (
                  <Divider style={{ margin: 0, borderColor: '#f0f0f0' }} />
                )}
              </div>
            )}
          />
        </div>
      )}

      {/* 底部链接 */}
      {notifications.length > 0 && (
        <>
          <Divider style={{ margin: 0 }} />
          <div style={{
            padding: '12px 20px',
            textAlign: 'center',
            backgroundColor: '#fafafa'
          }}>
            <Button
              type="link"
              size="small"
              onClick={() => {
                window.location.href = '/notifications';
              }}
              style={{
                color: '#667eea',
                fontWeight: 500,
                padding: 0
              }}
            >
              查看全部通知 →
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => notificationContent}
      trigger={['click']}
      placement="bottomRight"
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (newOpen) {
          fetchNotifications();
        }
      }}
    >
      <Badge count={unreadCount} size="small" offset={[0, 2]}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backgroundColor: open ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
          border: open ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = open ? 'rgba(255, 255, 255, 0.2)' : 'transparent';
        }}
        >
          <BellOutlined style={{ fontSize: 18, color: 'white' }} />
        </div>
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown;
