# AI热点监控工具 - Agent Skills包

## 概述

AI热点监控工具的Agent Skills包提供可复用的热点监控、内容分析和通知发送功能，可被其他AI系统轻松集成和使用。

## 安装

```bash
npm install ai-hotspot-monitor-skills
```

## 快速开始

### 基本配置

```javascript
const AIHotspotMonitorSkills = require('ai-hotspot-monitor-skills');

const skills = new AIHotspotMonitorSkills({
  apiKey: 'your-openrouter-api-key',
  apiUrl: 'http://your-api-server.com'
});
```

### 配置选项

| 选项 | 类型 | 必需 | 默认值 | 说明 |
|------|------|--------|----------|------|
| apiKey | string | 否 | process.env.OPENROUTER_API_KEY | OpenRouter API密钥 |
| apiUrl | string | 否 | process.env.API_URL | 后端API地址 |
| emailService | object | 否 | null | 邮件服务配置 |
| webPushService | object | 否 | null | Web推送服务配置 |
| slackWebhook | string | 否 | null | Slack Webhook URL |

## 主要功能

### 1. 热点监控 (HotspotMonitor)

监控和发现科技热点内容。

```javascript
// 监控单个关键词
const result = await skills.monitorHotspots(['AI', 'GPT'], {
  sources: ['techcrunch', 'hackernews'],
  maxResults: 50,
  timeRange: '24h'
});

console.log(`发现 ${result.data.length} 个热点`);
```

#### 监控选项

- `sources`: 数据源数组（默认使用内置源）
- `maxResults`: 最大结果数量
- `timeRange`: 时间范围（24h, 7d, 30d）
- `includeAI`: 是否包含AI分析

### 2. 内容分析 (ContentAnalyzer)

使用AI分析内容的真实性和可信度。

```javascript
// 分析单个内容
const analysis = await skills.analyzeContent(
  'OpenAI发布新模型',
  'TechCrunch'
);

console.log(`真实性: ${analysis.data.isAuthentic}`);
console.log(`置信度: ${analysis.data.confidence}%`);
```

#### 分析选项

- `quick`: 使用快速分析模式
- `detailed`: 详细分析模式
- `batchSize`: 批量处理大小

### 3. 通知发送 (NotificationSender)

发送各类通知到不同渠道。

```javascript
// 发送邮件通知
await skills.sendNotification({
  title: '新热点发现',
  content: '检测到重要的AI技术进展',
  type: 'success',
  channels: ['email'],
  recipients: ['user@example.com']
});

// 发送Web推送
await skills.sendNotification({
  title: '紧急通知',
  content: '系统检测到重大技术突破',
  type: 'error',
  channels: ['webpush', 'slack']
});
```

#### 通知选项

- `channels`: 通知通道数组
- `recipients`: 接收者数组
- `priority`: 优先级（normal, high, emergency）
- `requireInteraction`: 是否要求用户确认

### 4. 批量操作

```javascript
// 批量监控
const batchResult = await skills.batchMonitor([
  { name: 'AI技术', keywords: ['AI', '机器学习'] },
  { name: '编程工具', keywords: ['IDE', '代码'] }
]);

// 批量发送
const batchSend = await skills.notificationSender.batchSend(notifications);
```

### 5. 智能扫描

结合热点监控和AI分析的智能扫描。

```javascript
const smartResult = await skills.smartScan({
  keywords: ['OpenAI', 'Google AI'],
  useAI: true,
  confidenceThreshold: 70
});

console.log('发现热点:', smartResult.length);
console.log('已验证:', smartResult.filter(h => h.status === 'verified').length);
```

## 高级功能

### 健康检查

检查Skills包的运行状态。

```javascript
const health = await skills.healthCheck();
console.log('状态:', health.status);
console.log('详情:', health.skills);
```

### 获取Skills信息

获取Skills包的详细信息。

```javascript
const info = skills.getSkillsInfo();
console.log('名称:', info.name);
console.log('版本:', info.version);
console.log('功能:', info.skills);
```

## 使用场景

### 场景1: AI助手集成

将热点监控功能集成到AI助手中。

```javascript
const skills = new AIHotspotMonitorSkills(config);

async function aiAssistantHandler(userQuery) {
  // 判断是否需要热点监控
  if (userQuery.includes('监控') || userQuery.includes('热点')) {
    const result = await skills.monitorHotspots(['AI']);
    return `已为您监控AI相关热点，发现${result.total}条新内容`;
  }
  // 其他处理...
}
```

### 场景2: 自动化脚本

在自动化脚本中使用Skills包。

```javascript
const skills = new AIHotspotMonitorSkills(config);

async function automatedMonitor() {
  setInterval(async () => {
    const result = await skills.monitorHotspots(['GPT', 'LLM']);
    console.log(`定时监控: ${result.total}条新内容`);
  }, 30 * 60 * 1000); // 每30分钟
}
```

### 场景3: 微信公众号监控

为微信公众号开发热点监控功能。

```javascript
const skills = new AIHotspotMonitorSkills(config);

async function wechatMonitor(article) {
  // 分析文章内容
  const analysis = await skills.analyzeContent(article.content, 'WeChat');

  // 如果内容可信，发送通知
  if (analysis.data.isAuthentic && analysis.data.confidence > 70) {
    await skills.sendNotification({
      title: '热点文章验证通过',
      content: article.title,
      type: 'success'
    });
  }

  return analysis;
}
```

### 场景4: 企业内部工具

为企业内部工具集成监控功能。

```javascript
const skills = new AIHotspotMonitorSkills(config);

// 员工热点提交
async function employeeHotspotSubmission(content) {
  const analysis = await skills.analyzeContent(content);

  if (analysis.data.isAuthentic) {
    await skills.sendNotification({
      title: '员工提交的热点',
      content: analysis.data.summary,
      type: 'success',
      recipients: ['manager@company.com']
    });
  }

  return analysis;
}
```

## 错误处理

所有Skills方法都包含错误处理：

```javascript
try {
  const result = await skills.monitorHotspots(['AI']);
  // 处理结果
} catch (error) {
  console.error('操作失败:', error.message);
  // 降级处理
}
```

## 性能优化

### 并发处理

Skills包内部已实现并发处理：

- 批量监控：支持并发监控多个关键词组
- 批量发送：支持并发发送多个通知
- 智能扫描：并发分析和验证内容

### 缓存机制

建议在使用时添加缓存层：

```javascript
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 600 }); // 10分钟缓存

async function cachedMonitor(keywords) {
  const cacheKey = `hotspot:${keywords.join(',')}`;
  let result = cache.get(cacheKey);

  if (!result) {
    result = await skills.monitorHotspots(keywords);
    cache.set(cacheKey, result);
  }

  return result;
}
```

## 配置建议

### 开发环境

```javascript
{
  apiKey: 'dev-api-key',
  apiUrl: 'http://localhost:5000',
  emailService: {
    enabled: false
  }
}
```

### 生产环境

```javascript
{
  apiKey: process.env.OPENROUTER_API_KEY,
  apiUrl: 'https://api.your-domain.com',
  emailService: {
    enabled: true,
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  webPushService: {
    enabled: true,
    vapidKeys: process.env.VAPID_KEYS
  },
  slackWebhook: process.env.SLACK_WEBHOOK
}
```

## 测试

运行内置示例：

```bash
npm run example
```

或自定义测试：

```javascript
const skills = new AIHotspotMonitorSkills(config);

// 测试健康检查
const health = await skills.healthCheck();
console.assert(health.status === 'healthy', '健康检查失败');

// 测试内容分析
const analysis = await skills.analyzeContent('测试内容');
console.assert(analysis.success, '内容分析失败');
```

## 常见问题

### Q: 如何处理API限流？
A: Skills包内部已实现重试机制，建议在外层添加速率限制。

### Q: 如何提高性能？
A: 使用批量操作、启用缓存、合理设置并发数。

### Q: 支持自定义数据源吗？
A: 可以，通过配置自定义数据源覆盖默认源。

### Q: 如何调试？
A: 设置 `DEBUG=true` 环境变量启用详细日志。

## 版本历史

### v1.0.0 (当前版本)
- 热点监控功能
- 内容分析功能
- 通知发送功能
- 批量操作支持
- 智能扫描功能

## 许可证

MIT License

## 支持

- 文档: https://your-docs-site.com
- 问题反馈: https://github.com/your-repo/issues
- 技术支持: support@example.com

---

🔥 让AI热点监控Skills帮助您的AI系统更智能！