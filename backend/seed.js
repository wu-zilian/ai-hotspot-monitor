const mongoose = require('mongoose');
const User = require('./src/models/User');

// 初始化管理员账号
async function initAdmin() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hotspot-monitor');
    console.log('已连接到 MongoDB');

    // 检查是否已存在管理员
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('管理员账号已存在');
      // 删除旧的管理员账号
      await User.deleteOne({ email: 'admin@example.com' });
      console.log('已删除旧的管理员账号');
    }

    // 创建管理员账号（使用明文密码，让模型的 pre-save hook 处理哈希）
    const admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',  // 明文密码，模型会自动哈希
      role: 'admin'
    });

    await admin.save();
    console.log('✅ 管理员账号创建成功！');
    console.log('邮箱: admin@example.com');
    console.log('密码: admin123');
    console.log('⚠️  请在登录后立即修改密码！');

    process.exit(0);
  } catch (error) {
    console.error('初始化管理员失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initAdmin();
