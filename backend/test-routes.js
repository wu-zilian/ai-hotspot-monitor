const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Notification = require('./src/models/Notification');

// 导入路由
const notificationRoutes = require('./src/routes/notification.routes');
const authMiddleware = require('./src/middleware/auth.middleware');

// 创建测试应用
const app = express();
app.use(express.json());
// 模拟认证中间件，设置测试用户
app.use('/api/notifications', (req, res, next) => {
  req.user = { userId: '69d764c9f8106f521223043e' };
  next();
}, notificationRoutes);

async function testRoutes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ai-hotspot-monitor');

    // 创建测试通知
    await Notification.deleteMany({ userId: '69d764c9f8106f521223043e' });
    await Notification.create([
      { userId: '69d764c9f8106f521223043e', title: '测试1', content: '内容1', isRead: false },
      { userId: '69d764c9f8106f521223043e', title: '测试2', content: '内容2', isRead: false }
    ]);

    console.log('=== 测试通知API路由 ===\n');

    // 测试获取通知
    console.log('1. GET /api/notifications');
    const getRes = await request(app)
      .get('/api/notifications')
      .expect(200);
    console.log('   返回通知数:', getRes.body.length);

    // 测试标记全部已读
    console.log('\n2. PUT /api/notifications/read-all');
    const markRes = await request(app)
      .put('/api/notifications/read-all')
      .expect(200);
    console.log('   响应:', markRes.body);

    // 验证结果
    const unreadCount = await Notification.countDocuments({
      userId: '69d764c9f8106f521223043e',
      isRead: false
    });
    console.log('\n3. 验证结果');
    console.log('   未读通知数:', unreadCount);

    // 清理
    await Notification.deleteMany({ userId: '69d764c9f8106f521223043e' });

    console.log('\n✅ 路由测试完成');
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error.message);
    process.exit(1);
  }
}

testRoutes();
