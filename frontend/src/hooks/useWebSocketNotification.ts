import { useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';

interface WebSocketMessage {
  type: string;
  taskId?: string;
  hotspot?: any;
  summary?: any;
  progress?: any;
  timestamp?: string;
}

interface UseWebSocketNotificationProps {
  userId: string;
  token: string;
  enabled: boolean;
}

export function useWebSocketNotification({
  userId,
  token,
  enabled
}: UseWebSocketNotificationProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const permissionRef = useRef<NotificationPermission>('default');

  // 请求通知权限
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('浏览器不支持通知');
      return false;
    }

    if (Notification.permission === 'granted') {
      permissionRef.current = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      permissionRef.current = permission;
      return permission === 'granted';
    }

    return false;
  }, []);

  // 显示桌面通知
  const showNotification = useCallback((
    title: string,
    body: string,
    icon?: string,
    onClick?: () => void
  ) => {
    if (permissionRef.current !== 'granted') {
      console.log('通知权限未授予');
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: icon || '🔥',
      badge: icon || '🔥',
      tag: `ai-hotspot-${Date.now()}`,
      requireInteraction: false,
      silent: false
    });

    if (onClick) {
      notification.onclick = () => {
        onClick();
        notification.close();
        // 聚焦窗口
        window.focus();
      };
    }

    // 5秒后自动关闭
    setTimeout(() => {
      notification.close();
    }, 5000);
  }, []);

  // 连接WebSocket
  const connect = useCallback(() => {
    if (!enabled || !userId || !token) {
      return;
    }

    try {
      const wsUrl = `ws://localhost:5001/ws?userId=${userId}&token=${token}`;
      console.log('连接WebSocket:', wsUrl);

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket连接成功');
        // 清除重连定时器
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log('收到WebSocket消息:', data.type);

          switch (data.type) {
            case 'connected':
              console.log('WebSocket服务器确认连接');
              break;

            case 'scanProgress':
              console.log('扫描进度更新:', data.progress);
              // 不显示桌面通知，后端会创建通知记录
              break;

            case 'analysisResult':
              console.log('AI分析进度:', data.progress);
              // 不显示桌面通知，避免打扰
              break;

            case 'scanComplete':
              console.log('扫描完成:', data.summary);
              // 不显示桌面通知，后端已创建通知记录
              // 只刷新通知列表
              window.dispatchEvent(new CustomEvent('notification-refresh'));
              break;

            case 'scanError':
              console.log('扫描失败:', data.summary);
              // 不显示桌面通知
              break;

            case 'pong':
              // 心跳响应，不需要处理
              break;

            default:
              console.log('未知消息类型:', data.type);
          }
        } catch (error) {
          console.error('处理WebSocket消息失败:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket连接关闭:', event.code, event.reason);

        // 如果不是主动关闭，尝试重连
        if (enabled && event.code !== 1000) {
          console.log('3秒后尝试重连...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket错误:', error);
      };

    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
    }
  }, [enabled, userId, token, showNotification]);

  // 发送心跳
  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  // 初始化
  useEffect(() => {
    if (enabled) {
      // 请求通知权限
      requestNotificationPermission();

      // 连接WebSocket
      connect();

      // 每30秒发送心跳
      const heartbeatInterval = setInterval(sendPing, 30000);

      return () => {
        // 清理
        clearInterval(heartbeatInterval);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
          wsRef.current.close(1000, 'Component unmount');
          wsRef.current = null;
        }
      };
    }
  }, [enabled, connect, sendPing, requestNotificationPermission]);

  return {
    connected: wsRef.current?.readyState === WebSocket.OPEN,
    requestPermission: requestNotificationPermission
  };
}
