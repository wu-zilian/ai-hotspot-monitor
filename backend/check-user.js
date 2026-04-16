require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Keyword = require('./src/models/Keyword');

mongoose.connect('mongodb://localhost:27017/ai-hotspot-monitor')
  .then(async () => {
    // 查找用户
    const user = await User.findOne({ email: 'wq1217227253@163.com' });
    if (!user) {
      console.log('用户不存在');
      process.exit(1);
    }

    console.log('=== 用户信息 ===');
    console.log('用户名:', user.username);
    console.log('邮箱:', user.email);
    console.log('用户ID:', user._id.toString());

    console.log('\n=== 用户设置 ===');
    console.log('通知邮箱:', user.notificationEmail || user.email);
    console.log('邮件通知:', user.settings?.notificationEmail !== false ? '启用' : '禁用');
    console.log('Web推送:', user.settings?.notificationWeb !== false ? '启用' : '禁用');

    console.log('\n=== 全局SMTP配置 ===');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || '未设置');
    console.log('SMTP_PORT:', process.env.SMTP_PORT || '未设置');
    console.log('SMTP_SECURE:', process.env.SMTP_SECURE || '未设置');
    console.log('SMTP_USER:', process.env.SMTP_USER || '未设置');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '已配置(***)' : '未设置');
    console.log('SMTP_FROM:', process.env.SMTP_FROM || '未设置');

    console.log('\n=== 关键词列表 ===');
    const keywords = await Keyword.find({ userId: user._id, isActive: true });
    console.log('活跃关键词数量:', keywords.length);
    keywords.forEach(k => console.log('  -', k.name));

    if (keywords.length > 0 && process.env.SMTP_HOST) {
      console.log('\n✅ 配置完整，可以触发扫描测试');
      console.log('用户ID:', user._id.toString());
    } else {
      console.log('\n❌ 配置不完整');
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('错误:', err.message);
    process.exit(1);
  });
