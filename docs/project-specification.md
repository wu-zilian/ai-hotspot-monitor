# AI热点监控工具 - 项目需求文档

## 项目概述

本项目旨在开发一个AI热点监控工具，帮助AI编程博主、科技媒体从业者等用户自动发现和通知热点内容，实现7×24小时热点监控。

### 核心价值
- **自动化热点发现**：减少人工搜索时间
- **实时通知**：第一时间获取热点信息
- **AI内容验证**：识别虚假内容，确保信息真实性
- **多渠道监控**：覆盖科技新闻、社交媒体、论坛等

## 目标用户

- AI编程博主
- 科技媒体从业者
- 投资人
- 研究人员
- 企业技术团队

## 核心功能需求

### 1. 用户管理
- 用户注册/登录
- 个人资料管理
- 权限控制（普通用户/管理员）

### 2. 关键词监控
- 添加/编辑/删除监控关键词
- 关键词分组管理
- 关键词优先级设置
- 关键词搜索范围配置

### 3. 内容监控
- 多源数据采集（科技新闻、社交媒体、论坛）
- 关键词匹配算法
- 内容去重机制
- AI内容真实性分析

### 4. 通知系统
- 邮件通知
- Web推送通知
- Slack/微信集成
- 通知历史记录

### 5. 数据展示
- 热点趋势图表
- 关键词热度排行
- 内容详情页面
- 历史记录查询

### 6. Agent Skills封装
- 创建可复用的Skills包
- 支持其他AI调用监控功能
- 标准化API接口

## 技术架构

### 后端技术栈
- **运行时环境**: Node.js 18+
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

### AI服务集成
- **OpenRouter API**: 用于内容真实性分析
- **备用方案**: Claude API, OpenAI API

## API对接方案

### OpenRouter API 最新对接方法

```javascript
// 最新OpenRouter API对接代码
import axios from 'axios';

interface AIAnalysisResult {
  isAuthentic: boolean;
  confidence: number;
  reasons: string[];
  summary: string;
}

export const analyzeWithAI = async (content: string, source: string): Promise<AIAnalysisResult> => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

    if (!apiKey) {
      throw new Error('OpenRouter API配置缺失');
    }

    const prompt = `
请分析以下内容的真实性，特别关注AI编程相关的热点信息：

内容来源：${source}
内容文本：
${content}

请回答以下问题：
1. 这段内容是否真实可信？
2. 如果是虚假信息，请指出可能的问题点
3. 如果是真实信息，请确认其可信度
4. 给出整体可信度评分（0-100）

请以JSON格式返回分析结果，包括：
- isAuthentic: boolean (是否真实)
- confidence: number (可信度评分)
- reasons: string[] (分析理由)
- summary: string (简要总结)
    `;

    const response = await axios.post(
      apiUrl,
      {
        model: 'openai/gpt-4o', // 最新模型
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
          'X-Title': process.env.OPENROUTER_TITLE || 'AI Hotspot Monitor',
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    // 解析AI返回的JSON结果
    const analysisResult: AIAnalysisResult = JSON.parse(aiResponse);

    return analysisResult;
  } catch (error) {
    console.error('AI分析失败:', error);
    return {
      isAuthentic: false,
      confidence: 0,
      reasons: ['AI分析服务不可用'],
      summary: '无法验证内容真实性'
    };
  }
};
```

### 环境变量配置

```env
# OpenRouter API配置
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_REFERER=http://localhost:3000
OPENROUTER_TITLE=AI Hotspot Monitor

# 服务器配置
PORT=5000

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

# 爬虫配置
CRAWLER_INTERVAL=30m
MAX_CRAWL_THREADS=5
CRAWLER_TIMEOUT=30000
```

## 开发计划

### 阶段1: 基础架构搭建 (1-2天)
- 项目初始化
- 数据库设计
- 基础API框架搭建
- 用户认证系统

### 阶段2: 核心功能开发 (3-4天)
- 关键词管理功能
- 爬虫模块开发
- 内容分析引擎
- 通知系统

### 阶段3: 前端界面开发 (2-3天)
- 响应式Web界面
- 数据可视化
- 用户交互优化

### 阶段4: Skills封装与测试 (2天)
- Skills包开发
- 集成测试
- 文档编写

## 风险评估与应对

### 风险1：爬虫被网站封禁
- **应对**：使用代理IP池、遵守robots.txt、限制请求频率、随机User-Agent

### 风险2：AI分析准确性
- **应对**：多模型验证、人工审核机制、置信度阈值、定期模型更新

### 风险3：系统性能
- **应对**：异步处理、缓存机制、水平扩展、负载均衡

### 风险4：API服务不可用
- **应对**：备用API服务、本地缓存、降级处理

## 验收标准

1. ✅ 用户可以成功注册/登录
2. ✅ 用户可以添加/管理监控关键词
3. ✅ 系统能够自动发现热点内容
4. ✅ AI内容真实性分析准确率>90%
5. ✅ 通知系统100%可靠
6. ✅ 响应式Web界面正常工作
7. ✅ Skills包可正常调用
8. ✅ 系统稳定运行24小时以上

## 下一步行动

1. 确认技术方案细节
2. 开始基础架构搭建
3. 进行数据库设计
4. 开发核心功能模块

本项目将解决AI编程博主等用户手动搜索热点效率低、容易遗漏、无法7×24小时监控的痛点，提供自动化热点发现解决方案。