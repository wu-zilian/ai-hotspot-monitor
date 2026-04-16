const cron = require('node-cron');
const Task = require('../models/Task');
const { scrapeTechNews } = require('./crawler.service');
const { analyzeWithAI } = require('./ai.service');
const { sendNotification } = require('./notification.service');

// 存储定时任务
const scheduledTasks = new Map();

// 触发爬虫任务
exports.triggerCrawlerTask = async (task) => {
  try {
    console.log(`开始执行任务: ${task.name}`);

    // 获取关键词
    const keywords = task.keywords || [];

    // 抓取内容
    const contents = await scrapeTechNews(keywords);

    // 分析并通知
    for (const content of contents) {
      const analysis = await analyzeWithAI(content.content, content.source);

      if (analysis.isAuthentic && analysis.confidence > 70) {
        await sendNotification(task.userId, {
          ...content,
          isVerified: true,
          analysis
        });
      }
    }

    console.log(`任务 ${task.name} 执行完成，发现 ${contents.length} 条相关内容`);
  } catch (error) {
    console.error(`任务 ${task.name} 执行失败:`, error);
  }
};

// 启动定时任务
exports.startScheduledTask = (task) => {
  // 如果任务已存在，先停止
  if (scheduledTasks.has(task._id.toString())) {
    exports.stopScheduledTask(task._id.toString());
  }

  // 创建新的定时任务
  const scheduledTask = cron.schedule(task.schedule, async () => {
    await exports.triggerCrawlerTask(task);
  });

  scheduledTasks.set(task._id.toString(), scheduledTask);
  scheduledTask.start();

  console.log(`定时任务 ${task.name} 已启动，计划: ${task.schedule}`);
};

// 停止定时任务
exports.stopScheduledTask = (taskId) => {
  const task = scheduledTasks.get(taskId);
  if (task) {
    task.stop();
    scheduledTasks.delete(taskId);
    console.log(`定时任务 ${taskId} 已停止`);
  }
};

// 启动所有活跃任务
exports.startAllTasks = async () => {
  try {
    const tasks = await Task.find({ isActive: true });

    for (const task of tasks) {
      exports.startScheduledTask(task);
    }

    console.log(`已启动 ${tasks.length} 个定时任务`);
  } catch (error) {
    console.error('启动所有任务失败:', error);
  }
};

// 停止所有任务
exports.stopAllTasks = () => {
  scheduledTasks.forEach((task, taskId) => {
    task.stop();
  });
  scheduledTasks.clear();
  console.log('所有定时任务已停止');
};

// 初始化定时任务系统
exports.initializeTaskSystem = async () => {
  await exports.startAllTasks();
};
