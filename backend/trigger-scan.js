require('dotenv').config();
const mongoose = require('mongoose');
const asyncScanService = require('./src/services/asyncScan.service');
const { v4: uuidv4 } = require('./src/utils/uuid');

const TEST_USER_ID = '69d764c9f8106f521223043e';

async function triggerAutoScan() {
  await mongoose.connect('mongodb://localhost:27017/ai-hotspot-monitor');

  console.log('=== 触发定时扫描测试 ===\n');
  console.log('用户ID:', TEST_USER_ID);
  console.log('扫描源: hackernews, bing, sogou');
  console.log('AI分析: 启用');
  console.log('通知方式: 邮件 + Web推送\n');

  console.log('正在启动扫描任务...');

  try {
    const taskId = await asyncScanService.startScan(TEST_USER_ID, {
      sources: ['hackernews', 'bing'],
      limit: 10,
      includeWechat: false,
      includeHotTrends: true,
      enableAI: true
    });

    console.log('✅ 扫描任务已启动');
    console.log('   任务ID:', taskId);
    console.log('\n扫描流程:');
    console.log('1. 爬取数据 → 2. 保存热点 → 3. AI分析 → 4. 发送通知');
    console.log('\n如果发现新热点：');
    console.log('   📧 邮件通知 → wq1217227253@163.com');
    console.log('   🔔 Web通知 → 浏览器通知中心');
    console.log('\n请在浏览器查看通知中心（WebSocket实时推送）');
    console.log('并检查邮箱收到热点通知邮件');

    console.log('\n正在等待扫描结果...');

    // 轮询检查任务状态
    let status = 'pending';
    let attempts = 0;
    const maxAttempts = 60; // 最多等待60次（约5分钟）

    while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 每5秒检查一次

      const task = await asyncScanService.getTaskStatus(taskId, TEST_USER_ID);
      if (task) {
        status = task.status;
        const progress = task.progress;
        console.log(`   状态: ${status} | 爬取: ${progress.crawled} | 保存: ${progress.saved} | 分析: ${progress.analyzed}/${progress.total}`);
      }
      attempts++;
    }

    console.log('\n=== 扫描结果 ===');
    console.log('最终状态:', status);

    // 获取最终通知数
    const Notification = require('./src/models/Notification');
    const unreadCount = await Notification.countDocuments({
      userId: TEST_USER_ID,
      isRead: false
    });
    console.log('未读通知数:', unreadCount);

    console.log('\n✅ 测试完成！请检查：');
    console.log('1. 浏览器通知中心（铃铛图标）');
    console.log('2. 邮箱 wq1217227253@163.com');

    process.exit(0);
  } catch (error) {
    console.error('扫描失败:', error.message);
    process.exit(1);
  }
}

triggerAutoScan();
