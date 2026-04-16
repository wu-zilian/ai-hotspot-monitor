import { notification } from 'antd';
import {
  WebSocketMessage,
  WebSocketOptions,
  AnalysisResult,
  EventCallback
} from '../types/websocket';

/**
 * WebSocket客户端
 * 用于接收扫描进度和AI分析结果
 */
class ScanWebSocketClient {
  // 类属性声明
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000;
  private listeners: Map<string, EventCallback[]> = new Map();
  private isConnecting: boolean = false;
  private isManualClose: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 属性已在声明时初始化
  }

  /**
   * 连接WebSocket
   * @param userId - 用户ID
   * @param token - 认证Token
   * @param options - 配置选项
   */
  connect(userId: string, token: string, options: WebSocketOptions = {}): boolean {
    const {
      onConnected,
      onDisconnected,
      onError,
      onMessage,
      autoReconnect = true
    } = options;

    if (!userId || !token) {
      console.error('WebSocket连接失败: 缺少userId或token');
      return false;
    }

    // 如果已经连接，先断开
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket已连接，跳过重复连接');
      return true;
    }

    this.isConnecting = true;
    this.isManualClose = false;

    // 构建WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const wsUrl = `${protocol}//${host}${port}/ws?userId=${userId}&token=${token}`;

    console.log(`正在连接WebSocket: ${wsUrl.replace(token, '***')}`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket连接成功');
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // 发送心跳
        this.startHeartbeat();

        // 触发连接成功回调
        if (onConnected) onConnected();
        this.emit('connected');
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('收到WebSocket消息:', message);

          // 处理不同类型的消息
          this.handleMessage(message);

          // 触发通用消息回调
          if (onMessage) onMessage(message);
          this.emit('message', message);
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      };

      this.ws.onclose = (event: CloseEvent) => {
        console.log(`WebSocket连接关闭: code=${event.code}, reason=${event.reason}`);
        this.isConnecting = false;
        this.stopHeartbeat();

        // 触发断开连接回调
        if (onDisconnected) onDisconnected(event);
        this.emit('disconnected', event);

        // 自动重连
        if (!this.isManualClose && autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.connect(userId, token, options);
          }, this.reconnectInterval);
        }
      };

      this.ws.onerror = (error: Event) => {
        console.error('WebSocket错误:', error);
        this.isConnecting = false;

        // 触发错误回调
        if (onError) onError(error);
        this.emit('error', error);
      };

      return true;
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * 发送消息
   */
  send(message: Record<string, any>): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket未连接，无法发送消息');
    return false;
  }

  /**
   * 添加事件监听器
   */
  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听器
   */
  off(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  emit(event: string, data?: any): void {
    if (!this.listeners.has(event)) return;

    this.listeners.get(event)!.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`事件回调执行失败 [${event}]:`, error);
      }
    });
  }

  /**
   * 处理不同类型的消息
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'connected':
        this.emit('connected', message);
        break;

      case 'scanProgress':
        this.handleScanProgress(message);
        break;

      case 'analysisResult':
        this.handleAnalysisResult(message as any);
        break;

      case 'scanComplete':
        this.handleScanComplete(message);
        break;

      case 'scanError':
        this.handleScanError(message);
        break;

      case 'pong':
        // 心跳响应，无需处理
        break;

      default:
        console.warn('未知的消息类型:', message.type);
    }
  }

  /**
   * 处理扫描进度
   */
  private handleScanProgress(message: any): void {
    const { taskId, status, message: msg, phase, result } = message;

    console.log(`[扫描进度] ${status}: ${msg}`);

    // 显示进度通知
    if (status === 'crawling') {
      notification.info({
        key: `scan-${taskId}`,
        message: '正在扫描...',
        description: msg,
        duration: 0
      });
    } else if (status === 'crawled') {
      notification.info({
        key: `scan-${taskId}`,
        message: '爬取完成',
        description: `${result?.totalFetched || 0} 条数据`,
        duration: 3
      });
    } else if (status === 'saved') {
      notification.success({
        key: `scan-${taskId}`,
        message: '数据已保存',
        description: `${result?.saved || 0} 条新热点`,
        duration: 3
      });
    }

    this.emit('scanProgress', message);
  }

  /**
   * 处理AI分析结果
   */
  private handleAnalysisResult(message: AnalysisResult): void {
    const { taskId, hotspot, verification, progress, error } = message;

    if (error) {
      console.warn(`[AI分析] 失败: ${error}`);
    } else {
      console.log(`[AI分析] ${hotspot?.title?.substring(0, 30)}... - ${verification?.status || 'unknown'} (${progress?.percentage || 0}%)`);
    }

    this.emit('analysisResult', message);
  }

  /**
   * 处理扫描完成
   */
  private handleScanComplete(message: any): void {
    const { taskId, summary } = message;

    notification.success({
      key: `scan-complete-${taskId}`,
      message: '扫描完成！',
      description: `共分析 ${summary?.total || 0} 条热点，成功 ${summary?.success || 0} 条`,
      duration: 5
    });

    this.emit('scanComplete', message);
  }

  /**
   * 处理扫描错误
   */
  private handleScanError(message: any): void {
    const { taskId, error } = message;

    notification.error({
      key: `scan-error-${taskId}`,
      message: '扫描出错',
      description: error?.message || '未知错误',
      duration: 5
    });

    this.emit('scanError', message);
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000); // 每30秒发送一次心跳
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 获取连接状态
   */
  getReadyState(): string {
    if (!this.ws) return 'CLOSED';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// 创建单例
const wsClient = new ScanWebSocketClient();

export default wsClient;
export { ScanWebSocketClient };

// 重新导出类型
export type {
  WebSocketMessage,
  WebSocketOptions,
  AnalysisResult,
  VerificationStatus,
  ConfidenceLevel,
  Verification,
  Analysis,
  Progress,
  HotspotInfo
} from '../types/websocket';
