const cron = require('node-cron');
const User = require('../models/User');
const asyncScanService = require('./asyncScan.service');

/**
 * 自动扫描调度服务
 * 根据用户设置的扫描间隔自动执行扫描任务
 */
class AutoScanScheduler {
  constructor() {
    // 存储每个用户的定时任务
    this.userTasks = new Map(); // userId -> cron task
    // 存储用户的当前间隔配置
    this.userIntervals = new Map(); // userId -> interval (minutes)
  }

  /**
   * 启动调度器
   */
  async start() {
    console.log('[自动扫描调度器] 启动中...');

    // 获取所有有活跃关键词的用户
    const Keyword = require('../models/Keyword');
    const usersWithKeywords = await Keyword.distinct('userId');

    console.log(`[自动扫描调度器] 找到 ${usersWithKeywords.length} 个有关键词的用户`);

    // 为每个用户启动定时任务
    for (const userId of usersWithKeywords) {
      try {
        const user = await User.findById(userId);
        if (!user || !user.settings) {
          continue;
        }

        const interval = user.settings.scanInterval || 30;
        await this.scheduleUserScan(userId, interval);
        console.log(`[自动扫描调度器] 用户 ${user.username || userId} 自动扫描已启动，间隔: ${interval}分钟`);
      } catch (error) {
        console.error(`[自动扫描调度器] 启动用户 ${userId} 的扫描失败:`, error.message);
      }
    }

    console.log(`[自动扫描调度器] 已启动 ${this.userTasks.size} 个自动扫描任务`);
  }

  /**
   * 为用户调度扫描任务
   * @param {string} userId - 用户ID
   * @param {number} intervalMinutes - 扫描间隔（分钟）
   */
  async scheduleUserScan(userId, intervalMinutes) {
    // 如果已有任务，先停止
    this.stopUserScan(userId);

    // 验证间隔范围
    if (intervalMinutes < 5) intervalMinutes = 5;
    if (intervalMinutes > 120) intervalMinutes = 120;

    // 生成 cron 表达式
    const cronExpression = this.intervalToCron(intervalMinutes);

    console.log(`[自动扫描调度器] 用户 ${userId} 设置扫描间隔: ${intervalMinutes}分钟, cron: ${cronExpression}`);

    // 创建定时任务
    const task = cron.schedule(cronExpression, async () => {
      try {
        console.log(`[自动扫描调度器] 触发用户 ${userId} 的自动扫描`);
        await this.executeUserScan(userId);
      } catch (error) {
        console.error(`[自动扫描调度器] 用户 ${userId} 自动扫描执行失败:`, error.message);
      }
    }, {
      scheduled: false
    });

    // 启动任务
    task.start();

    // 保存引用
    this.userTasks.set(userId.toString(), task);
    this.userIntervals.set(userId.toString(), intervalMinutes);

    return task;
  }

  /**
   * 停止用户的扫描任务
   * @param {string} userId - 用户ID
   */
  stopUserScan(userId) {
    const userIdStr = userId.toString();
    const existingTask = this.userTasks.get(userIdStr);

    if (existingTask) {
      existingTask.stop();
      this.userTasks.delete(userIdStr);
      this.userIntervals.delete(userIdStr);
      console.log(`[自动扫描调度器] 已停止用户 ${userId} 的自动扫描`);
    }
  }

  /**
   * 更新用户的扫描间隔
   * @param {string} userId - 用户ID
   * @param {number} intervalMinutes - 新的扫描间隔（分钟）
   */
  async updateUserScanInterval(userId, intervalMinutes) {
    console.log(`[自动扫描调度器] 更新用户 ${userId} 扫描间隔: ${intervalMinutes}分钟`);

    // 检查用户是否有活跃关键词
    const Keyword = require('../models/Keyword');
    const activeKeywordCount = await Keyword.countDocuments({
      userId,
      isActive: true
    });

    if (activeKeywordCount === 0) {
      console.log(`[自动扫描调度器] 用户 ${userId} 没有活跃关键词，不启动自动扫描`);
      this.stopUserScan(userId);
      return false;
    }

    await this.scheduleUserScan(userId, intervalMinutes);
    return true;
  }

  /**
   * 执行用户的扫描任务
   * @param {string} userId - 用户ID
   */
  async executeUserScan(userId) {
    try {
      console.log(`[自动扫描调度器] 开始执行用户 ${userId} 的扫描任务`);

      // 调用异步扫描服务
      const taskId = await asyncScanService.startScan(userId, {
        sources: ['hackernews', 'bing', 'sogou'],
        limit: 20,
        includeWechat: false,
        includeHotTrends: true,
        enableAI: true
      });

      console.log(`[自动扫描调度器] 用户 ${userId} 扫描任务已启动: ${taskId}`);
      return taskId;
    } catch (error) {
      console.error(`[自动扫描调度器] 用户 ${userId} 扫描任务启动失败:`, error.message);
      throw error;
    }
  }

  /**
   * 将分钟间隔转换为 cron 表达式
   * @param {number} minutes - 间隔分钟数
   * @returns {string} cron 表达式
   */
  intervalToCron(minutes) {
    // 如果是整点时间（如 30, 60, 120）
    if (minutes >= 60 && minutes % 60 === 0) {
      const hours = minutes / 60;
      if (hours === 24) {
        return '0 0 * * *'; // 每天午夜
      }
      return `0 */${hours} * * *`; // 每N小时
    }

    // 如果是 5, 10, 15, 20, 30 分钟
    if ([5, 10, 15, 20, 30].includes(minutes)) {
      return `*/${minutes} * * * *`;
    }

    // 其他情况，使用分钟间隔
    return `*/${minutes} * * * *`;
  }

  /**
   * 获取用户的定时任务状态
   * @param {string} userId - 用户ID
   * @returns {object} 任务状态
   */
  getUserTaskStatus(userId) {
    const userIdStr = userId.toString();
    const hasTask = this.userTasks.has(userIdStr);
    const interval = this.userIntervals.get(userIdStr);

    return {
      scheduled: hasTask,
      interval: interval || null,
      cronExpression: hasTask ? this.intervalToCron(interval) : null
    };
  }

  /**
   * 获取所有任务状态
   * @returns {array} 所有任务状态
   */
  getAllTasksStatus() {
    const tasks = [];
    for (const [userId, interval] of this.userIntervals) {
      tasks.push({
        userId,
        interval,
        cronExpression: this.intervalToCron(interval),
        scheduled: this.userTasks.has(userId)
      });
    }
    return tasks;
  }

  /**
   * 停止所有任务
   */
  stopAll() {
    console.log(`[自动扫描调度器] 停止所有 ${this.userTasks.size} 个任务`);
    for (const [userId, task] of this.userTasks) {
      task.stop();
    }
    this.userTasks.clear();
    this.userIntervals.clear();
  }

  /**
   * 检查并重启用户任务（用于关键词变化时）
   * @param {string} userId - 用户ID
   */
  async refreshUserTask(userId) {
    const Keyword = require('../models/Keyword');
    const activeKeywordCount = await Keyword.countDocuments({
      userId,
      isActive: true
    });

    if (activeKeywordCount === 0) {
      // 没有关键词，停止任务
      this.stopUserScan(userId);
      console.log(`[自动扫描调度器] 用户 ${userId} 无活跃关键词，已停止自动扫描`);
      return false;
    }

    // 读取用户的扫描间隔设置
    const user = await User.findById(userId);
    if (!user || !user.settings) {
      return false;
    }

    const interval = user.settings.scanInterval || 30;
    await this.scheduleUserScan(userId, interval);
    return true;
  }
}

// 导出单例
module.exports = new AutoScanScheduler();
