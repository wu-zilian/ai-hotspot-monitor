// API配置
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// API端点
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me'
  },
  // 关键词相关
  KEYWORDS: {
    LIST: '/api/keywords',
    CREATE: '/api/keywords',
    UPDATE: (id: string) => `/api/keywords/${id}`,
    DELETE: (id: string) => `/api/keywords/${id}`,
    GET_BY_ID: (id: string) => `/api/keywords/${id}`
  },
  // 内容相关
  CONTENT: {
    HOTSPOTS: '/api/content/hotspots',
    ANALYZE: '/api/content/analyze',
    SCAN: '/api/content/scan'
  },
  // 任务相关
  TASKS: {
    LIST: '/api/tasks',
    CREATE: '/api/tasks',
    UPDATE: (id: string) => `/api/tasks/${id}`,
    DELETE: (id: string) => `/api/tasks/${id}`,
    TRIGGER: (id: string) => `/api/tasks/${id}/trigger`
  },
  // 通知相关
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/mark-all-read',
    DELETE: (id: string) => `/api/notifications/${id}`
  },
  // 健康检查
  HEALTH: '/health'
};

// 完整URL构建函数
export const buildApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;
