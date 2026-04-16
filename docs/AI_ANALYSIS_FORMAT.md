# AI内容分析返回格式说明

## 完整返回结构

AI内容分析服务返回一个标准化的分析结果对象，包含验证信息、置信度评分和详细分析。

```typescript
interface AIAnalysisResult {
  // ========== 基础字段（向后兼容） ==========
  isAuthentic: boolean;        // 内容是否真实
  confidence: number;           // 可信度评分 (0-100)
  summary: string;              // 内容摘要
  reasons: string[];            // 分析理由列表

  // ========== 完整验证结果 ==========
  verification: {
    status: 'verified' | 'unverified' | 'suspicious' | 'unknown';
    isAuthentic: boolean;
    confidence: number;         // 可信度评分 (0-100)
    level: 'high' | 'medium' | 'low';
  };

  // ========== 详细分析 ==========
  analysis: {
    summary: string;            // 内容摘要
    reasons: string[];          // 分析理由列表
    indicators: {               // 验证指标
      hasSource: boolean;       // 是否有明确来源
      hasAuthor: boolean;       // 是否有作者信息
      hasDate: boolean;         // 是否有时间信息
      isOfficial: boolean;      // 是否来自官方渠道
    };
  };
}
```

## 字段说明

### confidence (可信度评分)

| 类型 | 范围 | 说明 |
|------|------|------|
| `number` | 0-100 | 评估内容真实可信程度的数值评分 |

**评分标准：**

| 分数范围 | 可信程度 | 说明 |
|---------|---------|------|
| 90-100 | 非常可信 | 内容来自官方或权威渠道，有完整来源信息 |
| 70-89 | 基本可信 | 内容有一定来源，信息基本可靠 |
| 50-69 | 需要确认 | 内容缺乏明确来源，需要进一步验证 |
| 0-49 | 不可信 | 内容存在虚假信息或来源可疑 |

### verification.status (验证状态)

| 状态 | 说明 | 对应confidence范围 |
|------|------|-------------------|
| `verified` | 已验证 | 90-100 |
| `unverified` | 未验证 | 0-100（待确认） |
| `suspicious` | 可疑 | 0-49（有虚假迹象） |
| `unknown` | 未知 | 无法判断 |

### verification.level (可信度等级)

| 等级 | 说明 | 对应confidence范围 |
|------|------|-------------------|
| `high` | 高可信度 | 90-100 |
| `medium` | 中等可信度 | 70-89 |
| `low` | 低可信度 | 0-69 |

### analysis.indicators (验证指标)

| 指标 | 说明 | 类型 |
|------|------|------|
| `hasSource` | 是否有明确来源 | boolean |
| `hasAuthor` | 是否有作者信息 | boolean |
| `hasDate` | 是否有时间信息 | boolean |
| `isOfficial` | 是否来自官方渠道 | boolean |

## 返回示例

### 示例1：已验证的高可信内容

```json
{
  "isAuthentic": true,
  "confidence": 95,
  "summary": "OpenAI官方发布GPT-4o模型公告",
  "reasons": [
    "来自OpenAI官方博客",
    "有明确的发布日期和作者",
    "内容技术细节详实"
  ],
  "verification": {
    "status": "verified",
    "isAuthentic": true,
    "confidence": 95,
    "level": "high"
  },
  "analysis": {
    "summary": "OpenAI官方发布GPT-4o模型公告",
    "reasons": [
      "来自OpenAI官方博客",
      "有明确的发布日期和作者",
      "内容技术细节详实"
    ],
    "indicators": {
      "hasSource": true,
      "hasAuthor": true,
      "hasDate": true,
      "isOfficial": true
    }
  }
}
```

### 示例2：未验证的中等可信内容

```json
{
  "isAuthentic": true,
  "confidence": 75,
  "summary": "某科技媒体报道AI新进展",
  "reasons": [
    "来源为知名科技媒体",
    "但缺乏原始信息源链接"
  ],
  "verification": {
    "status": "unverified",
    "isAuthentic": true,
    "confidence": 75,
    "level": "medium"
  },
  "analysis": {
    "summary": "某科技媒体报道AI新进展",
    "reasons": [
      "来源为知名科技媒体",
      "但缺乏原始信息源链接"
    ],
    "indicators": {
      "hasSource": true,
      "hasAuthor": true,
      "hasDate": true,
      "isOfficial": false
    }
  }
}
```

### 示例3：可疑的低可信内容

```json
{
  "isAuthentic": false,
  "confidence": 30,
  "summary": "声称某公司将发布革命性AI产品",
  "reasons": [
    "缺乏具体来源",
    "内容过于夸大",
    "无法找到相关官方信息"
  ],
  "verification": {
    "status": "suspicious",
    "isAuthentic": false,
    "confidence": 30,
    "level": "low"
  },
  "analysis": {
    "summary": "声称某公司将发布革命性AI产品",
    "reasons": [
      "缺乏具体来源",
      "内容过于夸大",
      "无法找到相关官方信息"
    ],
    "indicators": {
      "hasSource": false,
      "hasAuthor": false,
      "hasDate": false,
      "isOfficial": false
    }
  }
}
```

## 使用场景

### 1. 前端显示

```typescript
// 根据confidence显示不同的标签颜色
function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return 'success'; // 绿色
  if (confidence >= 70) return 'processing'; // 蓝色
  if (confidence >= 50) return 'warning'; // 橙色
  return 'error'; // 红色
}

// 显示验证状态
function getVerificationStatus(status: string): string {
  switch (status) {
    case 'verified': return '✓ 已验证';
    case 'unverified': return '未验证';
    case 'suspicious': return '⚠ 可疑';
    case 'unknown': return '? 未知';
  }
}
```

### 2. 后端过滤

```javascript
// 只获取高可信度的热点
const verifiedHotspots = await Hotspot.find({
  'verification.level': 'high',
  'verification.confidence': { $gte: 90 }
});

// 排除可疑内容
const safeHotspots = await Hotspot.find({
  'verification.status': { $ne: 'suspicious' }
});
```

### 3. 通知决策

```javascript
// 根据confidence决定是否发送通知
if (result.confidence >= 70) {
  // 发送通知
  await sendNotification(userId, hotspot);
} else {
  // 标记为待审核
  await markForReview(hotspot);
}
```

## 数据库存储

Hotspot模型中已包含完整的验证结果：

```javascript
{
  // 基础字段
  isVerified: Boolean,
  confidence: Number,  // 0-100

  // 完整验证结果
  verification: {
    status: String,    // 'verified' | 'unverified' | 'suspicious' | 'unknown'
    isAuthentic: Boolean,
    confidence: Number,
    level: String      // 'high' | 'medium' | 'low'
  },

  // 详细分析
  analysis: {
    summary: String,
    reasons: [String],
    indicators: {
      hasSource: Boolean,
      hasAuthor: Boolean,
      hasDate: Boolean,
      isOfficial: Boolean
    }
  }
}
```

## WebSocket实时通知

AI分析结果会通过WebSocket实时推送：

```json
{
  "type": "analysisResult",
  "taskId": "xxx",
  "hotspot": {
    "id": "hotspot_id",
    "title": "热点标题",
    "source": "HackerNews"
  },
  "verification": {
    "status": "verified",
    "isAuthentic": true,
    "confidence": 92,
    "level": "high"
  },
  "analysis": {
    "summary": "内容摘要",
    "reasons": ["理由1", "理由2"],
    "indicators": {
      "hasSource": true,
      "hasAuthor": true,
      "hasDate": true,
      "isOfficial": false
    }
  },
  "progress": {
    "current": 1,
    "total": 50,
    "percentage": 2
  },
  "success": true
}
```

## 错误处理

当AI分析失败时，返回默认值：

```json
{
  "isAuthentic": false,
  "confidence": 0,
  "summary": "无法验证内容真实性",
  "reasons": ["AI分析服务不可用"],
  "verification": {
    "status": "unknown",
    "isAuthentic": false,
    "confidence": 0,
    "level": "low"
  },
  "analysis": {
    "summary": "无法验证内容真实性",
    "reasons": ["AI分析服务不可用"],
    "indicators": {}
  }
}
```

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/services/ai.service.js` | AI分析服务实现 |
| `src/models/Hotspot.js` | Hotspot数据模型 |
| `src/services/websocket.service.js` | WebSocket实时通知 |

---

**文档版本**: v1.0
**更新日期**: 2026-04-11
