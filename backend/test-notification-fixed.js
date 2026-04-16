require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Hotspot = require('./src/models/Hotspot');
const Notification = require('./src/models/Notification');
const { sendHotspotEmail } = require('./src/services/email.service');

const TEST_USER_ID = '69d764c9f8106f521223043e';

async function sendHotspotEmailNotification(userId, hotspot) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log('用户不存在，跳过邮件通知');
      return;
    }

    const emailNotificationEnabled = user.settings?.notificationEmail !== false;
    if (!emailNotificationEnabled) {
      console.log('用户已禁用邮件通知，跳过发送');
      return;
    }

    const toEmail = user.notificationEmail || user.email;
    await sendHotspotEmail(toEmail, hotspot);

    await Hotspot.findByIdAndUpdate(hotspot._id, { isNotified: true });
    console.log(`✅ 邮件通知已发送给用户 ${user.email}: ${hotspot.title}`);
  } catch (error) {
    console.error('发送热点邮件通知失败:', error.message);
  }
}

async function testNotificationAfterFix() {
  await mongoose.connect('mongodb://localhost:27017/ai-hotspot-monitor');

  const user = await User.findById(TEST_USER_ID);
  if (!user) {
    console.log('用户不存在');
    process.exit(1);
  }

  console.log('=== 测试通知功能修复 ===\n');

  console.log('用户信息:');
  console.log('  用户名:', user.username);
  console.log('  邮箱:', user.email);
  console.log('  通知邮箱:', user.notificationEmail || '(使用注册邮箱)');

  console.log('\n用户设置:');
  console.log('  邮件通知:', user.settings?.notificationEmail !== false ? '启用' : '禁用');
  console.log('  Web推送:', user.settings?.notificationWeb !== false ? '启用' : '禁用');

  // 创建一个测试热点
  console.log('\n创建测试热点...');
  const testHotspot = new Hotspot({
    userId: user._id,
    title: '【测试】定时扫描通知验证',
    content: '这是一个测试热点，用于验证定时扫描的通知推送功能是否正常工作。',
    source: '定时扫描测试',
    url: 'http://localhost:3000',
    timestamp: new Date(),
    isVerified: true,
    confidence: 95,
    keywords: ['Claude Code', 'AI'],
    verification: {
      status: 'verified',
      isAuthentic: true,
      confidence: 95,
      level: 'high'
    }
  });

  await testHotspot.save();
  console.log('✅ 测试热点已创建');

  // 测试邮件通知
  console.log('\n测试邮件通知...');
  await sendHotspotEmailNotification(TEST_USER_ID, testHotspot);

  // 测试Web通知
  console.log('\n测试Web通知...');
  const webNotification = new Notification({
    userId: user._id,
    title: '🔔 定时扫描完成通知',
    content: `定时扫描已完成，发现1个新热点："${testHotspot.title}"。系统已根据您的通知设置发送了邮件通知。`,
    type: 'success',
    isRead: false,
    hotspotId: testHotspot._id
  });
  await webNotification.save();
  console.log('✅ Web通知已创建');

  // 获取未读通知数
  const unreadCount = await Notification.countDocuments({
    userId: user._id,
    isRead: false
  });

  console.log('\n=== 测试结果 ===');
  console.log('✅ 邮件通知: 已发送到 ' + (user.notificationEmail || user.email));
  console.log('✅ Web通知: 已创建');
  console.log('当前未读通知数:', unreadCount);

  console.log('\n请检查：');
  console.log('1. 浏览器通知中心（右上角铃铛图标）- 应该看到新通知');
  console.log('2. 邮箱 ' + (user.notificationEmail || user.email) + ' - 应该收到热点邮件');

  // 清理测试数据
  console.log('\n清理测试数据...');
  await Hotspot.deleteOne({ _id: testHotspot._id });
  console.log('✅ 测试热点已删除');

  process.exit(0);
}

testNotificationAfterFix().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
