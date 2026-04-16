require('dotenv').config();
const mongoose = require('mongoose');
const asyncScanService = require('./src/services/asyncScan.service');
const User = require('./src/models/User');
const Notification = require('./src/models/Notification');
const { sendHotspotEmail } = require('./src/services/email.service');

const TEST_USER_ID = '69d764c9f8106f521223043e';

async function testNotification() {
  await mongoose.connect('mongodb://localhost:27017/ai-hotspot-monitor');

  const user = await User.findById(TEST_USER_ID);
  if (!user) {
    console.log('用户不存在');
    process.exit(1);
  }

  console.log('=== 开始通知测试 ===\n');

  // 1. 测试 Web 通知
  console.log('1. 测试 Web 推送通知...');
  const webNotification = new Notification({
    userId: user._id,
    title: '🔔 定时扫描通知测试',
    content: '这是一条由定时扫描触发的测试Web通知，用于验证通知推送功能是否正常工作。',
    type: 'success',
    isRead: false
  });
  await webNotification.save();
  console.log('✅ Web通知已创建，通知中心应该能看到此消息');

  // 2. 测试邮件通知
  console.log('\n2. 测试邮件通知...');
  const testHotspot = {
    title: '【测试】定时扫描发现的新热点',
    content: '这是定时扫描发现的测试热点内容。当系统按设置的间隔自动扫描发现新的AI热点时，会向您发送类似的邮件通知。您可以在系统设置中调整扫描间隔和通知方式。',
    source: '定时扫描测试',
    timestamp: new Date(),
    url: 'http://localhost:3000',
    confidence: 88,
    keywords: ['Claude Code', 'AI']
  };

  try {
    await sendHotspotEmail(user.notificationEmail || user.email, testHotspot);
    console.log('✅ 邮件通知已发送到:', user.notificationEmail || user.email);
    console.log('   请检查邮箱查看测试邮件');
  } catch (emailError) {
    console.log('❌ 邮件发送失败:', emailError.message);
  }

  // 3. 检查通知设置
  console.log('\n3. 当前通知设置:');
  console.log('   通知邮箱:', user.notificationEmail || user.email);
  console.log('   邮件通知:', user.settings?.notificationEmail !== false ? '启用' : '禁用');
  console.log('   Web推送:', user.settings?.notificationWeb !== false ? '启用' : '禁用');

  // 4. 获取未读通知数
  const unreadCount = await Notification.countDocuments({
    userId: user._id,
    isRead: false
  });
  console.log('\n4. 当前未读通知数:', unreadCount);

  console.log('\n=== 测试完成 ===');
  console.log('请检查：');
  console.log('1. 浏览器通知中心（右上角铃铛图标）');
  console.log('2. 邮箱 ' + (user.notificationEmail || user.email));

  process.exit(0);
}

testNotification().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
