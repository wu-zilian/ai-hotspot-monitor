# AI服务配置指南

## 概述

AI热点监控工具支持多种AI服务提供商，包括OpenRouter和DeepSeek。您可以根据需要选择合适的服务。

## 支持的AI服务

### 1. OpenRouter（默认）

OpenRouter是一个AI模型聚合平台，支持多种主流AI模型。

**优点：**
- 支持多种AI模型（GPT-4、Claude等）
- 统一的API接口
- 灵活的模型选择

**配置方法：**
```env
AI_SERVICE_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-4o
```

**获取API密钥：**
1. 访问 [OpenRouter官网](https://openrouter.ai/)
2. 注册账号并登录
3. 在API Keys页面生成密钥
4. 复制密钥到`.env`文件

### 2. DeepSeek

DeepSeek是国内的AI服务提供商，提供高质量的AI模型。

**优点：**
- 国内服务，访问稳定
- 价格相对较低
- 中文支持更好

**配置方法：**
```env
AI_SERVICE_PROVIDER=deepseek
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_MODEL=deepseek-chat
```

**获取API密钥：**
1. 访问 [DeepSeek官网](https://platform.deepseek.com/)
2. 注册账号并登录
3. 在API Keys页面生成密钥
4. 复制密钥到`.env`文件

## 配置步骤

### 1. 复制环境变量模板

```bash
cd backend
cp .env.example .env
```

### 2. 编辑.env文件

选择您要使用的AI服务：

#### 使用OpenRouter
```env
# AI服务配置
AI_SERVICE_PROVIDER=openrouter

# OpenRouter配置
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_REFERER=http://localhost:3000
OPENROUTER_TITLE=AI Hotspot Monitor
OPENROUTER_MODEL=openai/gpt-4o
```

#### 使用DeepSeek
```env
# AI服务配置
AI_SERVICE_PROVIDER=deepseek

# DeepSeek配置
DEEPSEEK_API_KEY=sk-your-deepseek-key-here
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_REFERER=http://localhost:3000
DEEPSEEK_TITLE=AI Hotspot Monitor
```

### 3. 重启应用

修改配置后需要重启后端服务：

```bash
cd backend
npm run dev
```

## 模型选择建议

### OpenRouter可用模型

- `openai/gpt-4o` - 最新GPT-4模型（推荐）
- `openai/gpt-4-turbo` - GPT-4 Turbo
- `anthropic/claude-3-opus` - Claude Opus
- `google/gemini-pro` - Gemini Pro

### DeepSeek可用模型

- `deepseek-chat` - DeepSeek Chat（推荐）
- `deepseek-coder` - DeepSeek Coder（代码专用）

## 性能对比

| 服务商 | 响应速度 | 中文支持 | 价格 | 推荐用途 |
|--------|---------|----------|------|----------|
| OpenRouter | 中等 | 优秀 | 中等 | 通用场景 |
| DeepSeek | 快速 | 优秀 | 较低 | 中文场景、成本敏感 |

## 常见问题

### Q: 如何切换AI服务？
A: 修改`.env`文件中的`AI_SERVICE_PROVIDER`配置，然后重启应用。

### Q: 两个服务可以同时使用吗？
A: 不建议同时使用，系统会根据配置选择一个服务提供商。

### Q: API调用失败怎么办？
A: 检查API密钥是否正确、网络连接是否正常、账户余额是否充足。

### Q: 如何测试配置是否正确？
A: 运行应用后查看控制台日志，会显示使用的AI服务商和分析结果。

### Q: DeepSeek和OpenRouter哪个更好？
A: 根据场景选择：
- 国内用户推荐DeepSeek（稳定、快速）
- 需要多种模型选择推荐OpenRouter
- 成本敏感推荐DeepSeek（价格更低）

## 成本估算

### OpenRouter
- GPT-4o: 约$5/1M输入tokens
- 根据使用量计费

### DeepSeek
- DeepSeek Chat: 约¥1/1M输入tokens
- 价格相对更低

## 配置示例

### 开发环境（DeepSeek）
```env
AI_SERVICE_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-test-key
DEEPSEEK_MODEL=deepseek-chat
```

### 生产环境（OpenRouter）
```env
AI_SERVICE_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-prod-key
OPENROUTER_MODEL=openai/gpt-4o
```

---

🔥 选择合适的AI服务，让热点监控更智能！