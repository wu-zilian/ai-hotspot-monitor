const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const http = require('http');

// 加载环境变量
require('dotenv').config();

const app = express();

// 创建HTTP服务器用于WebSocket
const server = http.createServer(app);

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 注释：开发模式下前端独立运行，不需要后端服务静态文件
// 生产构建时，可以取消以下注释
// app.use(express.static(path.join(__dirname, '../frontend/build')));

// 导入路由
const userRoutes = require('./src/routes/user.routes');
const keywordRoutes = require('./src/routes/keyword.routes');
const contentRoutes = require('./src/routes/content.routes');
const taskRoutes = require('./src/routes/task.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const settingsRoutes = require('./src/routes/settings.routes');

// 导入认证中间件
const authMiddleware = require('./src/middleware/auth.middleware');

// 导入用户控制器
const { getCurrentUser, updateProfile, changePassword } = require('./src/controllers/user.controller');

// 导入WebSocket服务
const { initWebSocketServer } = require('./src/services/websocket.service');

// 初始化管理员账号
async function initAdminUser() {
  try {
    const User = require('./src/models/User');
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('✅ 初始管理员账号已创建！');
      console.log('   邮箱: admin@example.com');
      console.log('   密码: admin123');
      console.log('   ⚠️  请在登录后立即修改密码！');
    }
  } catch (error) {
    console.error('创建管理员账号失败:', error.message);
  }
}

// API路由（需要认证的路由）
app.use('/api/keywords', authMiddleware, keywordRoutes);
app.use('/api/content', authMiddleware, contentRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/settings', settingsRoutes);

// 用户相关路由
app.use('/api/auth', userRoutes); // 公开路由：注册、登录
app.get('/api/users/me', authMiddleware, getCurrentUser); // 需要认证：获取当前用户
app.put('/api/users/profile', authMiddleware, updateProfile); // 需要认证：更新资料
app.put('/api/users/change-password', authMiddleware, changePassword); // 需要认证：修改密码

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), websocket: 'ready' });
});

// 注释：开发模式下前端独立运行，不需要SPA路由
// 生产构建时，可以取消以下注释
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
// });

// 连接数据库并启动服务器
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hotspot-monitor')
  .then(async () => {
    console.log('已连接到 MongoDB');
    await initAdminUser();

    // 初始化WebSocket服务器
    initWebSocketServer(server);
    console.log('WebSocket服务器已初始化');

    // 初始化自动扫描调度器
    const autoScanScheduler = require('./src/services/autoScan.scheduler');
    await autoScanScheduler.start();
    console.log('✅ 自动扫描调度器已启动');

    // 启动HTTP服务器
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws?userId=<userId>&token=<token>`);
      console.log(`🌐 API endpoint: http://localhost:${PORT}/api`);
    });
  })
  .catch((error) => {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  });

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM信号接收，正在关闭服务器...');

  // 停止自动扫描调度器
  const autoScanScheduler = require('./src/services/autoScan.scheduler');
  autoScanScheduler.stopAll();

  server.close(() => {
    console.log('服务器已关闭');
    mongoose.connection.close(false, () => {
      console.log('MongoDB连接已关闭');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT信号接收，正在关闭服务器...');

  // 停止自动扫描调度器
  const autoScanScheduler = require('./src/services/autoScan.scheduler');
  autoScanScheduler.stopAll();

  server.close(() => {
    console.log('服务器已关闭');
    mongoose.connection.close(false, () => {
      console.log('MongoDB连接已关闭');
      process.exit(0);
    });
  });
});

module.exports = app;