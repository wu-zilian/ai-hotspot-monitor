# AI热点监控系统 - 项目文档

> 项目文档导航中心

## 📚 文档目录

### [需求文档](./需求文档.md)
- 项目概述与目标
- 功能需求详解
- 非功能需求
- 数据需求定义
- 业务流程说明
- 验收标准

### [方案设计文档](./方案设计文档.md)
- 系统架构设计
- 模块设计详解
- 数据库设计
- API接口设计
- WebSocket协议
- 安全设计方案
- 性能优化方案
- 部署方案

### [测试文档](./测试文档.md)
- 功能测试用例
- 性能测试用例
- 安全测试用例
- 测试数据准备
- 测试命令说明
- 已知问题与修复
- 测试验收标准

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm >= 9.0.0

### 项目结构

```
ai-hotspot-monitor/
├── backend/              # 后端服务
│   ├── src/              # 源代码
│   ├── server.js        # 服务入口
│   └── package.json
├── frontend/             # 前端应用
│   ├── src/              # 源代码
│   ├── public/           # 静态资源
│   └── package.json
└── docs/                 # 项目文档
    ├── 需求文档.md
    ├── 方案设计文档.md
    ├── 测试文档.md
    └── README.md
```

### 启动服务

#### 后端服务
```bash
cd backend
npm install
npm start
# 运行在 http://localhost:5001
```

#### 前端服务
```bash
cd frontend
npm install
npm start
# 运行在 http://localhost:3000
```

---

## 📖 文档说明

### 需求文档
适用于：
- 产品经理了解功能范围
- 开发人员理解需求
- 测试人员编写测试用例

### 方案设计文档
适用于：
- 架构师进行技术选型
- 开发人员理解系统设计
- 运维人员部署维护

### 测试文档
适用于：
- 测试人员执行测试
- 开发人员自测功能
- 验收人员进行质量评估

---

## 🔧 开发相关

### API端点

**认证相关**
- POST `/api/auth/register` - 用户注册
- POST `/api/auth/login` - 用户登录
- GET `/api/users/me` - 获取当前用户

**关键词管理**
- GET `/api/keywords` - 获取关键词列表
- POST `/api/keywords` - 添加关键词
- PUT `/api/keywords/:id` - 更新关键词
- DELETE `/api/keywords/:id` - 删除关键词

**扫描任务**
- POST `/api/tasks/scan` - 触发扫描
- GET `/api/tasks/scan/:taskId/status` - 获取任务状态
- GET `/api/tasks/history` - 获取扫描历史

**通知**
- GET `/api/notifications` - 获取通知列表
- PUT `/api/notifications/read-all` - 全部标记已读
- DELETE `/api/notifications/:id` - 删除通知

**设置**
- GET `/api/settings` - 获取设置
- PUT `/api/settings` - 更新设置
- POST `/api/settings/test-email` - 测试邮件

### WebSocket连接

```
ws://localhost:5001/ws?userId={userId}&token={token}
```

---

## 🎯 功能模块

| 模块 | 状态 | 说明 |
|------|------|------|
| 仪表盘 | ✅ | 显示系统状态和最新热点 |
| 关键词管理 | ✅ | 管理监控关键词 |
| 历史记录 | ✅ | 查看和管理热点历史 |
| 通知中心 | ✅ | 集中查看通知 |
| 系统设置 | ✅ | 配置系统参数 |
| 个人中心 | ✅ | 管理账户信息 |
| 自动扫描 | ✅ | 定时自动执行扫描 |
| 邮件通知 | ✅ | 发送热点邮件通知 |
| AI分析 | ✅ | 内容真实性验证 |

---

## 📊 项目统计

### 代码量

| 类型 | 文件数 | 代码行数 |
|------|--------|----------|
| 前端组件 | 8 | ~3500 |
| 后端服务 | 15+ | ~5000 |
| 总计 | 23+ | ~8500+ |

### API接口

| 类型 | 数量 |
|------|------|
| GET | 15+ |
| POST | 5+ |
| PUT | 5+ |
| DELETE | 3+ |
| 总计 | 28+ |

### 数据模型

| 模型 | 字段数 |
|------|--------|
| User | 12+ |
| Keyword | 5 |
| Hotspot | 15+ |
| Notification | 7 |
| ScanTask | 10+ |

---

## 🐛 已知问题

所有发现问题已修复 ✅

### 修复记录

- rgba颜色值错误（4处）
- 缺少表单验证
- 删除操作无确认
- 查看详情未实现
- API路由缺失
- 扫描任务超时
- 通知API路由顺序
- 邮件通知检查逻辑

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交Issue
- 发送邮件
- 查看项目文档

---

**最后更新**：2026-04-11
**文档版本**：v1.0.0
