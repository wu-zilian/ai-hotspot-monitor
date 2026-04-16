const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  // 通知邮箱配置（用于接收热点通知）
  notificationEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: null  // 允许为空，表示使用注册邮箱
  },
  // 邮箱配置（用于发送邮件的授权信息）
  emailConfig: {
    prefix: {
      type: String,  // 邮箱前缀，如 "username" (不带@)
      trim: true
    },
    domain: {
      type: String,  // 邮箱后缀，如 "qq.com", "gmail.com"
      trim: true,
      enum: ['qq.com', 'gmail.com', '163.com', '126.com', 'outlook.com', 'yahoo.com', 'hotmail.com', null]
    },
    authCode: {
      type: String,  // 邮箱授权码（用于SMTP认证）
      trim: true
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // 用户设置
  settings: {
    scanInterval: {
      type: Number,
      default: 30,  // 默认30分钟
      min: 5,
      max: 120
    },
    notificationEmail: {
      type: Boolean,
      default: true
    },
    notificationWeb: {
      type: Boolean,
      default: true
    },
    notificationSlack: {
      type: Boolean,
      default: false
    },
    maxArticles: {
      type: Number,
      default: 100
    },
    confidenceThreshold: {
      type: Number,
      default: 70,
      min: 50,
      max: 100
    },
    autoDelete: {
      type: Boolean,
      default: false
    },
    retentionDays: {
      type: Number,
      default: 90
    }
  }
}, {
  timestamps: true
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 验证密码方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
