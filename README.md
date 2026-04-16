# 🔥 AI热点监控工具

## 项目简介

AI热点监控工具是一个智能化的热点发现和通知系统，帮助AI编程博主、科技媒体从业者等用户自动发现和通知热点内容，实现7×24小时热点监控。

## 核心功能

### 1. 智能热点发现
- 自动监控多个科技新闻网站
- 基于用户设定的关键词进行智能匹配
- 实时内容分析和去重

### 2. AI内容验证
- 集成OpenRouter API进行内容真实性分析
- 智能识别虚假内容和钓鱼信息
- 提供可信度评分和分析理由

### 3. 多渠道通知
- 邮件通知
- Web推送通知
- Slack集成（可选）
- 通知历史记录和统计

### 4. 关键词管理
- 添加、编辑、删除监控关键词
- 关键词分组和优先级设置
- 实时监控状态展示

### 5. 数据可视化
- 热点趋势图表
- 关键词热度排行
- 监控统计仪表板

## 技术架构

### 后端技术栈
- **运行时**: Node.js 18+
- **Web框架**: Express.js
- **数据库**: MongoDB
- **认证**: JWT
- **AI服务**: OpenRouter API
- **定时任务**: node-cron
- **爬虫**: axios + cheerio

### 前端技术栈
- **框架**: React 18+
- **语言**: TypeScript
- **UI库**: Ant Design
- **状态管理**: React Context
- **路由**: React Router
- **图表**: Recharts

### 项目结构

```
ai-hotspot-monitor/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── controllers/
│   │   │   ├── user.controller.ts
│   │   │   ├── keyword.controller.ts
│   │   │   ├── content.controller.ts
│   │   │   ├── task.controller.ts
│   │   │   └── notification.controller.ts
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Keyword.ts
│   │   │   ├── Task.ts
│   │   │   ├── Hotspot.ts
│   │   │   └── Notification.ts
│   │   ├── routes/
│   │   │   ├── user.routes.ts
│   │   │   ├── keyword.routes.ts
│   │   │   ├── content.routes.ts
│   │   │   ├── task.routes.ts
│   │   │   └── notification.routes.ts
│   │   └── services/
│   │       ├── ai.service.ts
│   │       ├── crawler.service.ts
│   │       ├── notification.service.ts
│   │       └── task.service.ts
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Keywords.tsx
│   │   │   ├── Notifications.tsx
│   │   │   └── Settings.tsx
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── public/
└── docs/
    └── project-specification.md
```

## 快速开始

### 环境要求
- Node.js 18+
- MongoDB 4.4+
- npm 或 yarn

### 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/your-repo/ai-hotspot-monitor.git
cd ai-hotspot-monitor
```

#### 2. 安装后端依赖
```bash
cd backend
npm install
```

#### 3. 配置环境变量
复制 `.env.example` 为 `.env` 并填写相应配置：

```env
# OpenRouter API配置
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_REFERER=http://localhost:3000
OPENROUTER_TITLE=AI Hotspot Monitor

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/ai-hotspot-monitor

# JWT配置
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=24h

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password
```

#### 4. 启动后端服务
```bash
npm run dev
# 或生产环境
npm start
```

#### 5. 安装前端依赖
```bash
cd frontend
npm install
```

#### 6. 启动前端开发服务器
```bash
npm start
```

### 访问应用
- 后端API: http://localhost:5000
- 前端应用: http://localhost:3000

## 主要功能使用指南

### 1. 用户注册/登录
- 访问应用首页
- 点击"注册"创建新账户
- 使用邮箱和密码登录系统

### 2. 添加监控关键词
- 进入"关键词管理"页面
- 点击"添加关键词"按钮
- 输入要监控的关键词名称和描述
- 设置关键词状态（启用/暂停）

### 3. 配置通知方式
- 进入"系统设置"页面
- 选择通知方式（邮件、Web推送等）
- 配置邮件地址或Slack集成
- 设置扫描频率和置信度阈值

### 4. 查看热点和通知
- 在仪表板查看最新发现的新闻热点
- 在通知中心查看历史通知
- 点击通知查看详情或标记已读

## API文档

### 用户认证
```
POST /api/auth/register - 用户注册
POST /api/auth/login - 用户登录
POST /api/auth/logout - 用户登出
GET /api/auth/me - 获取当前用户信息
```

### 关键词管理
```
GET /api/keywords - 获取关键词列表
POST /api/keywords - 创建关键词
GET /api/keywords/:id - 获取单个关键词
PUT /api/keywords/:id - 更新关键词
DELETE /api/keywords/:id - 删除关键词
```

### 内容监控
```
GET /api/content/hotspots - 获取热点内容
POST /api/content/analyze - 分析内容真实性
POST /api/content/scan - 手动触发扫描
```

### 通知管理
```
GET /api/notifications - 获取通知列表
PUT /api/notifications/:id/read - 标记通知已读
PUT /api/notifications/mark-all-read - 标记所有通知已读
DELETE /api/notifications/:id - 删除通知
```

### 定时任务
```
GET /api/tasks - 获取任务列表
POST /api/tasks - 创建任务
GET /api/tasks/:id - 获取单个任务
PUT /api/tasks/:id - 更新任务
DELETE /api/tasks/:id - 删除任务
POST /api/tasks/:id/trigger - 手动触发任务
```

## AI服务配置

### OpenRouter API集成

本项目使用OpenRouter API进行AI内容分析：

```javascript
// AI分析服务
import axios from 'axios';

export const analyzeWithAI = async (content: string, source: string) => {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'openai/gpt-4o',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `分析内容真实性：${content}`
      }]
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.OPENROUTER_REFERER,
        'X-Title': process.env.OPENROUTER_TITLE
      }
    }
  );

  return JSON.parse(response.data.choices[0].message.content);
};
```

### 内容分析能力
- 真实性验证
- 虚假内容识别
- 可信度评分（0-100）
- 分析理由提供
- 内容摘要生成

## 部署说明

### Docker部署
```bash
# 构建镜像
docker build -t ai-hotspot-monitor .

# 运行容器
docker run -p 5000:5000 -p 3000:3000 ai-hotspot-monitor
```

### 传统部署
```bash
# 后端部署
cd backend
npm install --production
NODE_ENV=production npm start

# 前端构建
cd frontend
npm run build
# 将build目录部署到Web服务器
```

## 安全注意事项

1. **API密钥保护**: 不要将API密钥提交到代码仓库
2. **数据库安全**: 使用强密码和访问控制
3. **HTTPS配置**: 生产环境必须使用HTTPS
4. **输入验证**: 所有用户输入必须进行验证
5. **速率限制**: 实施API速率限制防止滥用

## 常见问题

### Q: 如何获取OpenRouter API密钥？
A: 访问 [OpenRouter官网](https://openrouter.ai/) 注册并获取API密钥。

### Q: 支持哪些AI模型？
A: 默认使用OpenAI GPT-4o，可在.env中配置其他模型。

### Q: 如何提高监控效率？
A: 合理设置扫描间隔、优化关键词数量、提高置信度阈值。

### Q: 邮件通知不工作？
A: 检查SMTP配置、防火墙设置、邮件服务提供商限制。

## 开发计划

- [x] 后端API基础架构
- [x] 前端核心页面开发
- [x] Agent Skills封装开发
- [ ] 前后端集成测试
- [ ] 性能优化和部署

## 贡献指南

欢迎提交Issue和Pull Request来改进项目！

## 许可证

MIT License

## 联系方式

- 项目地址: https://github.com/your-repo/ai-hotspot-monitor
- 问题反馈: https://github.com/your-repo/ai-hotspot-monitor/issues
- 文档地址: https://your-repo.github.io/ai-hotspot-monitor/

---

🔥 让AI热点监控帮助您走在科技前沿！