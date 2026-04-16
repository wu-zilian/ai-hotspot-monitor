const mongoose = require('mongoose');
const { v4: uuidv4 } = require('../utils/uuid');

// 扫描任务状态模型
const scanTaskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'crawling', 'crawled', 'analyzing', 'completed', 'failed'],
    default: 'pending'
  },
  progress: {
    crawled: { type: Number, default: 0 },      // 已爬取数量
    saved: { type: Number, default: 0 },         // 已保存数量
    analyzed: { type: Number, default: 0 },      // 已分析数量
    total: { type: Number, default: 0 }          // 总数量
  },
  sources: [{
    name: String,
    status: String,
    count: Number,
    error: String
  }],
  keywords: [String],
  results: [{
    hotspotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotspot'
    },
    title: String,
    source: String,
    status: String,
    isVerified: Boolean,
    confidence: Number
  }],
  errors: [{
    message: String,
    timestamp: Date
  }],
  startedAt: Date,
  crawledAt: Date,
  completedAt: Date,
  metadata: {
    enableAI: { type: Boolean, default: true },
    aiProvider: String,
    totalFetched: Number,
    duplicateSkipped: Number
  }
}, {
  timestamps: true
});

// 索引
scanTaskSchema.index({ userId: 1, createdAt: -1 });
scanTaskSchema.index({ status: 1 });
scanTaskSchema.index({ 'progress.analyzed': 1 });

// 虚拟字段：计算进度百分比
scanTaskSchema.virtual('progressPercentage').get(function() {
  if (this.progress.total === 0) return 0;
  return Math.round((this.progress.analyzed / this.progress.total) * 100);
});

// 方法：更新进度
scanTaskSchema.methods.updateProgress = function(type, value) {
  if (type === 'crawled') {
    this.progress.crawled = value;
  } else if (type === 'saved') {
    this.progress.saved = value;
  } else if (type === 'analyzed') {
    this.progress.analyzed = value;
  } else if (type === 'total') {
    this.progress.total = value;
  }
  return this.save();
};

// 方法：添加错误
scanTaskSchema.methods.addError = function(message) {
  this.errors.push({
    message,
    timestamp: new Date()
  });
  return this.save();
};

// 方法：更新状态
scanTaskSchema.methods.updateStatus = function(status) {
  this.status = status;
  if (status === 'crawling') this.startedAt = new Date();
  if (status === 'crawled') this.crawledAt = new Date();
  if (status === 'completed' || status === 'failed') this.completedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('ScanTask', scanTaskSchema);
