const { v4: uuidv4 } = require('../utils/uuid');
const { crawlAllSources } = require('./crawler.service');
const { saveUniqueHotspots, processAIAnalysis, sendScanProgress, sendScanComplete, sendScanError } = require('./websocket.service');
const ScanTask = require('../models/ScanTask');
const Keyword = require('../models/Keyword');

/**
 * 异步扫描服务
 * 先保存数据，再异步进行AI分析
 */
class AsyncScanService {
  constructor() {
    this.activeTasks = new Map(); // taskId -> 任务信息
  }

  /**
   * 启动异步扫描任务
   */
  async startScan(userId, options = {}) {
    const {
      sources = ['hackernews', 'google', 'bing', 'ddg', 'sogou'],
      limit = 20,
      includeWechat = false,
      includeHotTrends = true,
      enableAI = true,
      keywords = null // 如果为null，则从数据库获取
    } = options;

    // 生成任务ID
    const taskId = uuidv4();

    console.log(`启动异步扫描任务: ${taskId}, userId: ${userId}`);

    // 获取关键词
    let keywordNames = keywords;
    if (!keywordNames) {
      const keywordDocs = await Keyword.find({ userId, isActive: true });
      keywordNames = keywordDocs.map(k => k.name);
    }

    if (keywordNames.length === 0) {
      throw new Error('没有可用的关键词');
    }

    // 创建扫描任务记录
    const scanTask = new ScanTask({
      taskId,
      userId,
      status: 'pending',
      keywords: keywordNames,
      progress: {
        crawled: 0,
        saved: 0,
        analyzed: 0,
        total: 0
      },
      sources: sources.map(s => ({
        name: s,
        status: 'pending',
        count: 0
      })),
      metadata: {
        enableAI,
        totalFetched: 0,
        duplicateSkipped: 0
      }
    });

    await scanTask.save();

    // 发送任务开始通知
    sendScanProgress(taskId, userId, {
      status: 'started',
      message: '扫描任务已启动',
      keywords: keywordNames,
      sources
    });

    // 异步执行扫描
    this.executeScan(taskId, userId, keywordNames, {
      sources,
      limit,
      includeWechat,
      includeHotTrends,
      enableAI
    }).catch(error => {
      console.error(`扫描任务执行失败: ${taskId}`, error);
      sendScanError(taskId, userId, error);
    });

    return taskId;
  }

  /**
   * 执行扫描（异步）
   */
  async executeScan(taskId, userId, keywords, options) {
    const scanTask = await ScanTask.findOne({ taskId });
    if (!scanTask) {
      throw new Error(`扫描任务不存在: ${taskId}`);
    }

    try {
      // 更新状态为爬取中
      await scanTask.updateStatus('crawling');
      sendScanProgress(taskId, userId, {
        status: 'crawling',
        message: '正在爬取热点数据...',
        phase: 'crawl'
      });

      // 调用爬虫服务
      console.log(`开始爬取: ${keywords.join(', ')}`);
      const crawlResult = await crawlAllSources(keywords, options);

      // 更新爬取结果
      await scanTask.updateStatus('crawled');
      await scanTask.updateProgress('crawled', crawlResult.totalFetched);
      await scanTask.updateProgress('total', crawlResult.totalUnique);
      scanTask.metadata.totalFetched = crawlResult.totalFetched;
      scanTask.sources = crawlResult.sources.map(s => ({
        name: s.name,
        status: s.success ? 'completed' : 'failed',
        count: s.count,
        error: s.error
      }));
      await scanTask.save();

      // 发送爬取完成通知
      sendScanProgress(taskId, userId, {
        status: 'crawled',
        message: `爬取完成，共获取 ${crawlResult.totalFetched} 条数据`,
        phase: 'crawl',
        result: {
          totalFetched: crawlResult.totalFetched,
          totalUnique: crawlResult.totalUnique,
          sources: crawlResult.sources
        }
      });

      // 保存热点数据（去重）
      console.log(`保存热点数据: ${crawlResult.results.length} 条`);
      const { savedHotspots, skippedUrls } = await saveUniqueHotspots(userId, crawlResult.results);

      await scanTask.updateProgress('saved', savedHotspots.length);
      scanTask.metadata.duplicateSkipped = skippedUrls.length;
      await scanTask.save();

      console.log(`保存成功: ${savedHotspots.length} 条，跳过: ${skippedUrls.length} 条`);

      // 发送保存完成通知
      sendScanProgress(taskId, userId, {
        status: 'saved',
        message: `数据已保存: ${savedHotspots.length} 条新热点`,
        phase: 'save',
        result: {
          saved: savedHotspots.length,
          skipped: skippedUrls.length
        }
      });

      // 如果启用AI分析且有数据需要分析
      if (options.enableAI && savedHotspots.length > 0) {
        // 异步执行AI分析
        console.log(`启动AI分析: ${savedHotspots.length} 条`);

        const hotspotIds = savedHotspots.map(h => h._id.toString());

        // 使用setTimeout确保在后台执行
        setTimeout(() => {
          processAIAnalysis(taskId, userId, hotspotIds).catch(error => {
            console.error(`AI分析失败: ${taskId}`, error);
            sendScanError(taskId, userId, error);
          });

          // 添加整体超时保护（10分钟后强制完成）
          const overallTimeout = setTimeout(async () => {
            try {
              const task = await ScanTask.findOne({ taskId });
              if (task && task.status === 'analyzing') {
                console.warn(`AI分析超时，强制完成任务: ${taskId}`);
                await task.updateStatus('completed');
                await task.addError('AI分析整体超时，任务已自动完成');
                sendScanComplete(taskId, userId, {
                  total: hotspotIds.length,
                  success: task.progress.analyzed,
                  failed: hotspotIds.length - task.progress.analyzed,
                  duration: Date.now() - task.startedAt.getTime(),
                  timeout: true
                });
              } else if (task && task.status === 'completed') {
                console.log(`任务已完成，取消超时定时器: ${taskId}`);
              }
            } catch (err) {
              console.error('处理超时任务失败:', err);
            }
          }, 10 * 60 * 1000); // 10分钟超时

          // 清理定时器引用（防止内存泄漏）
          processAIAnalysis(taskId, userId, hotspotIds).finally(() => {
            clearTimeout(overallTimeout);
          });

        }, 100);

      } else {
        // 不需要AI分析，直接完成
        await scanTask.updateStatus('completed');
        sendScanComplete(taskId, userId, {
          total: savedHotspots.length,
          message: '扫描完成（未启用AI分析）',
          skipped: skippedUrls.length
        });
      }

      return {
        taskId,
        savedCount: savedHotspots.length,
        skippedCount: skippedUrls.length,
        totalCount: crawlResult.totalFetched
      };

    } catch (error) {
      console.error(`扫描执行失败: ${taskId}`, error);
      await scanTask.updateStatus('failed');
      await scanTask.addError(error.message);
      throw error;
    }
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(taskId, userId) {
    const scanTask = await ScanTask.findOne({ taskId, userId });
    if (!scanTask) {
      return null;
    }

    return {
      taskId: scanTask.taskId,
      status: scanTask.status,
      progress: {
        ...scanTask.progress,
        percentage: scanTask.progressPercentage
      },
      sources: scanTask.sources,
      keywords: scanTask.keywords,
      errors: scanTask.errors,
      timestamps: {
        started: scanTask.startedAt,
        crawled: scanTask.crawledAt,
        completed: scanTask.completedAt,
        createdAt: scanTask.createdAt
      },
      metadata: scanTask.metadata
    };
  }

  /**
   * 获取用户的任务列表
   */
  async getUserTasks(userId, limit = 20) {
    console.log('[getUserTasks] Called with userId:', userId, 'limit:', limit);
    const tasks = await ScanTask.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    console.log('[getUserTasks] Found tasks:', tasks.length);
    return tasks.map(task => ({
      taskId: task.taskId,
      status: task.status,
      progress: {
        ...task.progress,
        percentage: task.progressPercentage
      },
      keywords: task.keywords,
      timestamps: {
        started: task.startedAt,
        completed: task.completedAt,
        createdAt: task.createdAt
      }
    }));
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId, userId) {
    const scanTask = await ScanTask.findOne({ taskId, userId });
    if (!scanTask) {
      throw new Error('任务不存在');
    }

    if (scanTask.status === 'completed' || scanTask.status === 'failed') {
      throw new Error('任务已完成或已失败，无法取消');
    }

    await scanTask.updateStatus('failed');
    await scanTask.addError('用户取消任务');

    sendScanProgress(taskId, userId, {
      status: 'cancelled',
      message: '任务已取消'
    });

    return true;
  }
}

// 导出单例
module.exports = new AsyncScanService();
