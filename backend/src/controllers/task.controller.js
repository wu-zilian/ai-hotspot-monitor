const Task = require('../models/Task');
const { triggerCrawlerTask } = require('../services/task.service');
const { crawlAllSources, getAvailableSources } = require('../services/crawler.service');
const { quickAnalyzeWithAI } = require('../services/ai.service');
const Hotspot = require('../models/Hotspot');
const Keyword = require('../models/Keyword');
const asyncScanService = require('../services/asyncScan.service');
const ScanTask = require('../models/ScanTask');

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user?.userId })
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { name, schedule, keywords, isActive } = req.body;
    const userId = req.user?.userId;

    const task = new Task({
      userId,
      name,
      schedule,
      keywords,
      isActive: isActive !== false
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { name, schedule, keywords, isActive } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.userId },
      { name, schedule, keywords, isActive },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user?.userId
    });

    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }

    res.json({ message: '任务删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

exports.triggerTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }

    // 触发任务执行
    await triggerCrawlerTask(task);

    res.json({ message: '任务已触发', task });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

/**
 * 手动触发扫描（新的异步版本）
 * 先保存数据，再异步进行AI分析，通过WebSocket通知进度
 */
exports.triggerManualScan = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { sources, limit, includeWechat, includeHotTrends, enableAI, testData } = req.body;

    console.log(`[异步扫描] 启动扫描任务, userId: ${userId}`);
    console.log(`[异步扫描] 参数:`, { sources, limit, includeWechat, includeHotTrends, enableAI });

    // 启动异步扫描任务
    const taskId = await asyncScanService.startScan(userId, {
      sources: sources || ['hackernews', 'google', 'bing', 'ddg', 'sogou'],
      limit: limit || 20,
      includeWechat: includeWechat || false,
      includeHotTrends: includeHotTrends !== false,
      enableAI: enableAI !== false
    });

    // 立即返回任务ID，不等待扫描完成
    res.json({
      success: true,
      message: '扫描任务已启动',
      taskId: taskId,
      websocketUrl: `/ws?userId=${userId}`,
      status: 'started',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('[异步扫描] 启动失败:', error);
    res.status(500).json({
      success: false,
      message: '启动扫描任务失败',
      error: error.message
    });
  }
};

/**
 * 获取扫描任务状态
 */
exports.getScanTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;

    const status = await asyncScanService.getTaskStatus(taskId, userId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取任务状态失败',
      error: error.message
    });
  }
};

/**
 * 获取用户的扫描任务列表
 */
exports.getScanTasks = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit) || 20;

    console.log('[getScanTasks] userId:', userId, 'limit:', limit);
    const tasks = await asyncScanService.getUserTasks(userId, limit);
    console.log('[getScanTasks] Tasks retrieved:', tasks.length);

    res.json({
      success: true,
      data: tasks
    });

  } catch (error) {
    console.error('[getScanTasks] Error:', error);
    console.error('[getScanTasks] Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: '获取任务列表失败',
      error: error.message
    });
  }
};

/**
 * 取消扫描任务
 */
exports.cancelScanTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;

    await asyncScanService.cancelTask(taskId, userId);

    res.json({
      success: true,
      message: '任务已取消'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取可用的信息源列表
 */
exports.getAvailableSources = async (req, res) => {
  try {
    const sources = getAvailableSources();
    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取信息源失败',
      error: error.message
    });
  }
};

/**
 * 获取扫描历史记录（支持分页和筛选）
 */
exports.getScanHistory = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const query = { userId };

    // 日期筛选
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // 状态筛选
    if (req.query.status) {
      query.status = req.query.status;
    }

    // 执行查询
    const [tasks, total] = await Promise.all([
      ScanTask.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ScanTask.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取历史记录失败',
      error: error.message
    });
  }
};

/**
 * 获取扫描任务详情
 */
exports.getScanTaskDetail = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;

    const task = await ScanTask.findOne({ taskId, userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    res.json({
      success: true,
      data: task
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取任务详情失败',
      error: error.message
    });
  }
};

/**
 * 旧的扫描接口（保持向后兼容）
 * @deprecated 请使用异步扫描接口
 */
exports.triggerManualScanLegacy = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { sources, limit, includeWechat, includeHotTrends, enableAI, testData } = req.body;

    // 获取用户的活跃关键词
    const keywords = await Keyword.find({ userId, isActive: true });
    const keywordNames = keywords.map(k => k.name);

    if (keywordNames.length === 0) {
      return res.json({
        success: true,
        message: '没有活跃的关键词',
        data: [],
        scanStarted: false
      });
    }

    console.log(`手动触发扫描，关键词: ${keywordNames.join(', ')}`);
    console.log(`AI分析: ${enableAI !== false ? '已启用' : '已禁用'}`);

    // 调用爬虫服务
    const crawlResult = await crawlAllSources(keywordNames, {
      sources: sources || ['hackernews', 'google', 'bing', 'ddg', 'sogou', 'weibo', 'twitter', 'bilibili'],
      maxResultsPerSource: limit || 20,
      includeWechat: includeWechat || false,
      includeHotTrends: includeHotTrends !== false
    });

    // 保存到数据库（启用AI分析）
    const savedHotspots = [];
    for (const hotspot of crawlResult.results) {
      try {
        const existingHotspot = await Hotspot.findOne({ url: hotspot.url });
        if (!existingHotspot) {
          let finalVerification = {
            isVerified: hotspot.isVerified,
            confidence: hotspot.confidence,
            analysis: {
              summary: hotspot.content.substring(0, 200),
              reasons: [`来源: ${hotspot.source}`]
            }
          };

          // 启用AI分析（如果未禁用）
          if (enableAI !== false) {
            try {
              console.log(`正在AI分析: ${hotspot.title.substring(0, 50)}...`);
              const aiAnalysis = await quickAnalyzeWithAI(hotspot.content, hotspot.source);

              finalVerification = {
                isVerified: aiAnalysis.isAuthentic,
                confidence: aiAnalysis.confidence || hotspot.confidence,
                analysis: {
                  summary: aiAnalysis.summary || hotspot.content.substring(0, 200),
                  reasons: aiAnalysis.reasons || [`来源: ${hotspot.source}`]
                }
              };
              console.log(`AI分析完成，置信度: ${finalVerification.confidence}%`);
            } catch (aiError) {
              console.warn(`AI分析失败，使用默认值: ${aiError.message}`);
            }
          }

          const newHotspot = new Hotspot({
            userId: userId,
            title: hotspot.title,
            content: hotspot.content,
            source: hotspot.source,
            url: hotspot.url,
            timestamp: new Date(hotspot.timestamp),
            isVerified: finalVerification.isVerified,
            confidence: finalVerification.confidence,
            keywords: hotspot.keywords,
            analysis: finalVerification.analysis,
            isNotified: false
          });
          await newHotspot.save();
          savedHotspots.push(newHotspot);
        }
      } catch (error) {
        console.error('保存热点失败:', error.message);
      }
    }

    res.json({
      success: true,
      message: '扫描完成',
      data: crawlResult.results,
      saved: savedHotspots.length,
      totalFetched: crawlResult.totalFetched,
      totalUnique: crawlResult.totalUnique,
      keywords: keywordNames,
      sources: crawlResult.sources,
      errors: crawlResult.errors,
      aiEnabled: enableAI !== false,
      scanTime: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '扫描失败',
      error: error.message
    });
  }
};
