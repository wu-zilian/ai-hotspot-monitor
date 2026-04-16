const mongoose = require('mongoose');

const hotspotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  content: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  // 验证状态
  isVerified: {
    type: Boolean,
    default: false
  },
  confidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // 新增：完整的验证结果
  verification: {
    status: {
      type: String,
      enum: ['verified', 'unverified', 'suspicious', 'unknown'],
      default: 'unknown'
    },
    isAuthentic: {
      type: Boolean,
      default: false
    },
    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    level: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'low'
    }
  },
  // 关键词匹配
  keywords: [{
    type: String,
    trim: true
  }],
  // AI分析结果
  analysis: {
    summary: String,
    reasons: [String],
    // 新增：分析指标
    indicators: {
      hasSource: { type: Boolean, default: false },
      hasAuthor: { type: Boolean, default: false },
      hasDate: { type: Boolean, default: false },
      isOfficial: { type: Boolean, default: false }
    }
  },
  // 通知状态
  isNotified: {
    type: Boolean,
    default: false
  },
  // 元数据（来自爬虫的额外信息）
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// 索引
hotspotSchema.index({ userId: 1, timestamp: -1 });
hotspotSchema.index({ userId: 1, 'verification.status': 1 });
hotspotSchema.index({ userId: 1, confidence: -1 });

module.exports = mongoose.model('Hotspot', hotspotSchema);
