// MongoDB初始化脚本
// 创建数据库、集合和初始数据

// 切换到ai-hotspot-monitor数据库
db = db.getSiblingDB('ai-hotspot-monitor');

// 创建集合（表）
db.createCollection('users');
db.createCollection('keywords');
db.createCollection('tasks');
db.createCollection('hotspots');
db.createCollection('notifications');

// 创建索引
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.keywords.createIndex({ userId: 1, name: 1 }, { unique: true });
db.tasks.createIndex({ userId: 1, isActive: 1 });
db.hotspots.createIndex({ userId: 1, timestamp: -1 });
db.hotspots.createIndex({ keywords: 1 });
db.notifications.createIndex({ userId: 1, isRead: 1, createdAt: -1 });

// 插入示例数据（可选）
// db.users.insertOne({
//   username: 'admin',
//   email: 'admin@example.com',
//   password: '$2a$10$example', // 需要实际的哈希密码
//   role: 'admin',
//   isActive: true,
//   createdAt: new Date(),
//   updatedAt: new Date()
// });

print('MongoDB初始化完成！');
print('创建的集合：users, keywords, tasks, hotspots, notifications');
print('数据库连接字符串：mongodb://localhost:27017/ai-hotspot-monitor');