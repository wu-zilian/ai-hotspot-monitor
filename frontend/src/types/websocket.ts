/**
 * WebSocket 客户端类型定义
 */

/**
 * WebSocket消息基础类型
 */
export interface WebSocketMessage {
  type: string;
  taskId?: string;
  timestamp?: Date | string;
  [key: string]: any;
}

/**
 * WebSocket连接选项
 */
export interface WebSocketOptions {
  onConnected?: () => void;
  onDisconnected?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  autoReconnect?: boolean;
}

/**
 * 验证状态
 */
export type VerificationStatus = 'verified' | 'unverified' | 'suspicious' | 'unknown';

/**
 * 可信度等级
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * 验证结果
 */
export interface Verification {
  status: VerificationStatus;
  isAuthentic: boolean;
  confidence: number;
  level: ConfidenceLevel;
}

/**
 * 分析指标
 */
export interface AnalysisIndicators {
  hasSource: boolean;
  hasAuthor: boolean;
  hasDate: boolean;
  isOfficial: boolean;
}

/**
 * 分析详情
 */
export interface Analysis {
  summary: string;
  reasons: string[];
  indicators?: AnalysisIndicators;
}

/**
 * 进度信息
 */
export interface Progress {
  current: number;
  total: number;
  percentage: number;
}

/**
 * 热点信息
 */
export interface HotspotInfo {
  id: string;
  title: string;
  source: string;
}

/**
 * AI分析结果消息
 */
export interface AnalysisResultMessage extends WebSocketMessage {
  type: 'analysisResult';
  taskId: string;
  hotspot: HotspotInfo;
  verification: Verification;
  analysis?: Analysis;
  progress: Progress;
  success: boolean;
  error?: string;
}

/**
 * 扫描进度消息
 */
export interface ScanProgressMessage extends WebSocketMessage {
  type: 'scanProgress';
  taskId: string;
  status: string;
  message: string;
  phase?: string;
  result?: {
    totalFetched?: number;
    saved?: number;
  };
}

/**
 * 扫描完成消息
 */
export interface ScanCompleteMessage extends WebSocketMessage {
  type: 'scanComplete';
  taskId: string;
  summary: {
    total: number;
    success: number;
    failed: number;
    duration: number;
  };
}

/**
 * 扫描错误消息
 */
export interface ScanErrorMessage extends WebSocketMessage {
  type: 'scanError';
  taskId: string;
  error: {
    message: string;
    stack?: string;
  };
}

/**
 * AI分析结果（简化版，用于组件）
 */
export interface AnalysisResult {
  taskId: string;
  hotspot: HotspotInfo;
  verification: Verification;
  analysis?: Analysis;
  progress: Progress;
  success: boolean;
  error?: string;
}

/**
 * 事件回调类型
 */
export type EventCallback = (data?: any) => void;
