const { v4: uuidv4 } = require('../utils/uuid');
const WebSocket = require('ws');
const ScanTask = require('../models/ScanTask');
const Hotspot = require('../models/Hotspot');
const User = require('../models/User');
const { analyzeWithAI } = require('./ai.service');

// 导入通知创建函数
const { createNotification } = require('../controllers/notification.controller');

// 导入邮件发送服务
const { sendHotspotEmail } = require('./email.service');

// WebSocket服务器实例
let wss = null;
const clients = new Map(); // userId -> WebSocket[]

/**
 * 初始化WebSocket服务器
 */
function initWebSocketServer(server) {
  if (wss) return wss;

  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // 从URL参数获取userId
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    const token = url.searchParams.get('token');

    if (!userId || !token) {
      ws.close(4001, 'Missing userId or token');
      return;
    }

    // TODO: 验证token有效性
    console.log(`WebSocket客户端连接: userId=${userId}`);

    // 将客户端加入对应userId的集合
    if (!clients.has(userId)) {
      clients.set(userId, []);
    }
    clients.get(userId).push(ws);

    // 发送连接成功消息
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket连接成功',
      timestamp: new Date()
    }));

    ws.on('close', () => {
      console.log(`WebSocket客户端断开: userId=${userId}`);
      const userClients = clients.get(userId);
      if (userClients) {
        const index = userClients.indexOf(ws);
        if (index > -1) {
          userClients.splice(index, 1);
        }
        if (userClients.length === 0) {
          clients.delete(userId);
        }
      }
    });

    ws.on('error', (error) => {
      console.error(`WebSocket错误: userId=${userId}`, error);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log(`收到消息: userId=${userId}`, message);

        // 处理心跳检测
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
        }
      } catch (error) {
        console.error('处理消息失败:', error);
      }
    });
  });

  console.log('WebSocket服务器已启动');
  return wss;
}

/**
 * 向指定用户发送消息
 */
function sendToUser(userId, message) {
  const userClients = clients.get(userId.toString());
  if (!userClients || userClients.length === 0) {
    console.log(`用户 ${userId} 没有在线客户端`);
    return false;
  }

  let successCount = 0;
  userClients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      successCount++;
    }
  });

  return successCount > 0;
}

/**
 * 广播消息到所有客户端
 */
function broadcast(message) {
  if (!wss) return;

  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

/**
 * 发送扫描进度更新
 */
function sendScanProgress(taskId, userId, progressData) {
  return sendToUser(userId, {
    type: 'scanProgress',
    taskId,
    ...progressData,
    timestamp: new Date()
  });
}

/**
 * 发送AI分析结果
 */
function sendAnalysisResult(taskId, userId, result) {
  const wsResult = sendToUser(userId, {
    type: 'analysisResult',
    taskId,
    ...result,
    timestamp: new Date()
  });

  // 如果是高价值热点（置信度>80且已验证），创建通知
  if (result.success && result.hotspot && result.verification) {
    const { verification, hotspot } = result;
    if (verification.isAuthentic && verification.confidence > 80) {
      // 检查用户是否启用了Web推送通知
      const User = require('../models/User');
      User.findById(userId).then(user => {
        if (!user) return;

        const webNotificationEnabled = user.settings?.notificationWeb !== false;

        if (webNotificationEnabled) {
          createNotification(
            userId,
            `发现热点: ${hotspot.title}`,
            `置信度 ${verification.confidence}% - ${result.analysis?.summary || '高价值AI热点'}`,
            'hotspot',
            hotspot.id
          ).catch(err => console.error('创建热点通知失败:', err));
        }
      }).catch(err => console.error('获取用户信息失败:', err));
    }
  }

  return wsResult;
}

/**
 * 发送扫描完成通知
 */
function sendScanComplete(taskId, userId, summary) {
  // 发送WebSocket消息
  const wsResult = sendToUser(userId, {
    type: 'scanComplete',
    taskId,
    summary,
    timestamp: new Date()
  });

  // 同时创建通知记录（基于用户设置）
  const User = require('../models/User');
  User.findById(userId).then(user => {
    if (!user) return;

    // 检查是否启用了Web推送通知
    const webNotificationEnabled = user.settings?.notificationWeb !== false;

    if (webNotificationEnabled && summary && summary.total > 0) {
      createNotification(
        userId,
        '扫描完成',
        `成功发现 ${summary.total} 条热点，其中 ${summary.success || summary.total} 条已完成AI分析`,
        'success'
      ).catch(err => console.error('创建扫描完成通知失败:', err));
    }
  }).catch(err => console.error('获取用户信息失败:', err));

  return wsResult;
}

/**
 * 发送扫描错误
 */
function sendScanError(taskId, userId, error) {
  // 发送WebSocket消息
  const wsResult = sendToUser(userId, {
    type: 'scanError',
    taskId,
    error: {
      message: error.message,
      stack: error.stack
    },
    timestamp: new Date()
  });

  // 同时创建通知记录
  createNotification(
    userId,
    '扫描失败',
    error.message || '扫描过程中发生错误，请重试',
    'error'
  ).catch(err => console.error('创建扫描失败通知失败:', err));

  return wsResult;
}

/**
 * 异步AI分析处理器
 * 分析已保存但未分析的热点
 */
async function processAIAnalysis(taskId, userId, hotspotIds) {
  const scanTask = await ScanTask.findOne({ taskId });
  if (!scanTask) {
    console.error(`扫描任务不存在: ${taskId}`);
    return;
  }

  console.log(`开始异步AI分析，共 ${hotspotIds.length} 条热点`);

  // 更新任务状态为分析中
  await scanTask.updateStatus('analyzing');
  await scanTask.updateProgress('total', hotspotIds.length);

  let analyzedCount = 0;
  let successCount = 0;
  let failedCount = 0;

  // 超时保护：为每个AI分析调用添加超时
  const analyzeWithTimeout = async (hotspot, timeoutMs = 45000) => {
    return Promise.race([
      analyzeWithAI(hotspot.content, hotspot.source),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI分析超时')), timeoutMs)
      )
    ]);
  };

  for (const hotspotId of hotspotIds) {
    try {
      const hotspot = await Hotspot.findById(hotspotId);
      if (!hotspot) {
        console.warn(`热点不存在: ${hotspotId}`);
        failedCount++;
        analyzedCount++;
        await scanTask.updateProgress('analyzed', analyzedCount);
        continue;
      }

      // 如果已经有分析结果，跳过
      if (hotspot.isVerified !== undefined && hotspot.confidence > 0) {
        console.log(`热点已有分析结果，跳过: ${hotspot.title.substring(0, 30)}`);
        analyzedCount++;
        await scanTask.updateProgress('analyzed', analyzedCount);
        continue;
      }

      console.log(`正在AI分析: ${hotspot.title.substring(0, 50)}...`);

      // 调用AI分析（带超时保护）
      let analysisResult;
      try {
        analysisResult = await analyzeWithTimeout(hotspot, 45000); // 45秒超时
      } catch (timeoutError) {
        console.warn(`AI分析超时，使用默认值: ${hotspot.title.substring(0, 30)}`);
        // 使用基于来源的默认评分
        const defaultConfidence = hotspot.source.includes('HackerNews') ? 70 : 50;
        analysisResult = {
          isAuthentic: defaultConfidence > 60,
          confidence: defaultConfidence,
          summary: hotspot.content.substring(0, 100),
          reasons: [`AI分析超时 - 来源: ${hotspot.source}`],
          verification: {
            status: 'unknown',
            isAuthentic: defaultConfidence > 60,
            confidence: defaultConfidence,
            level: defaultConfidence > 60 ? 'medium' : 'low'
          },
          analysis: {
            summary: hotspot.content.substring(0, 100),
            reasons: [`AI分析超时 - 来源: ${hotspot.source}`],
            indicators: {}
          }
        };
      }

      // 更新热点（包含完整的验证结果）
      hotspot.isVerified = analysisResult.isAuthentic;
      hotspot.confidence = analysisResult.confidence;

      // 保存完整的verification对象
      if (analysisResult.verification) {
        hotspot.verification = {
          status: analysisResult.verification.status || 'unknown',
          isAuthentic: analysisResult.verification.isAuthentic || analysisResult.isAuthentic,
          confidence: analysisResult.verification.confidence || analysisResult.confidence,
          level: analysisResult.verification.level || 'medium'
        };
      }

      // 保存分析详情
      hotspot.analysis = {
        summary: analysisResult.summary,
        reasons: analysisResult.reasons || [],
        indicators: analysisResult.analysis?.indicators || {}
      };

      await hotspot.save();

      successCount++;
      analyzedCount++;

      // 更新进度
      await scanTask.updateProgress('analyzed', analyzedCount);

      // 发送单个分析完成通知
      sendAnalysisResult(taskId, userId, {
        hotspot: {
          id: hotspot._id,
          title: hotspot.title,
          source: hotspot.source
        },
        // 完整的验证结果
        verification: {
          status: analysisResult.verification?.status || 'unknown',
          isAuthentic: analysisResult.isAuthentic,
          confidence: analysisResult.confidence,
          level: analysisResult.verification?.level || 'medium'
        },
        // 详细分析信息
        analysis: {
          summary: analysisResult.summary,
          reasons: analysisResult.reasons,
          indicators: analysisResult.analysis?.indicators || {}
        },
        progress: {
          current: analyzedCount,
          total: hotspotIds.length,
          percentage: Math.round((analyzedCount / hotspotIds.length) * 100)
        },
        success: true
      });

    } catch (error) {
      console.error(`AI分析失败: ${hotspotId}`, error);
      failedCount++;
      analyzedCount++; // 即使失败也计数，确保进度能完成

      try {
        await scanTask.addError(`分析失败 ${hotspotId}: ${error.message}`);
        await scanTask.updateProgress('analyzed', analyzedCount);
      } catch (saveError) {
        console.error('更新任务状态失败:', saveError);
      }

      // 发送分析失败通知
      sendAnalysisResult(taskId, userId, {
        hotspotId,
        error: error.message,
        success: false
      });
    }
  }

  // 更新任务状态为完成
  await scanTask.updateStatus('completed');

  // 发送完成通知
  sendScanComplete(taskId, userId, {
    total: hotspotIds.length,
    success: successCount,
    failed: failedCount,
    duration: Date.now() - scanTask.startedAt.getTime()
  });

  console.log(`AI分析完成: 成功 ${successCount}, 失败 ${failedCount}`);
}

/**
 * 批量保存热点（不去重）
 */
async function batchSaveHotspots(userId, hotspots) {
  const savedHotspots = [];

  for (const hotspot of hotspots) {
    try {
      const newHotspot = new Hotspot({
        userId: userId,
        title: hotspot.title,
        content: hotspot.content,
        source: hotspot.source,
        url: hotspot.url,
        timestamp: new Date(hotspot.timestamp),
        isVerified: false,          // 初始为未验证
        confidence: 0,              // 初始置信度为0
        keywords: hotspot.keywords || [],
        analysis: {
          summary: '等待AI分析...',
          reasons: []
        },
        isNotified: false,
        metadata: hotspot.metadata || {}
      });

      await newHotspot.save();
      savedHotspots.push(newHotspot);
    } catch (error) {
      console.error('保存热点失败:', hotspot.title, error.message);
    }
  }

  return savedHotspots;
}

/**
 * 去重并保存热点
 */
async function saveUniqueHotspots(userId, hotspots) {
  const savedHotspots = [];
  const skippedUrls = [];

  for (const hotspot of hotspots) {
    try {
      // 检查URL是否已存在
      const existing = await Hotspot.findOne({
        userId,
        url: hotspot.url
      });

      if (existing) {
        skippedUrls.push(hotspot.url);
        continue;
      }

      const newHotspot = new Hotspot({
        userId: userId,
        title: hotspot.title,
        content: hotspot.content,
        source: hotspot.source,
        url: hotspot.url,
        timestamp: new Date(hotspot.timestamp),
        isVerified: false,
        confidence: 0,
        keywords: hotspot.keywords || [],
        analysis: {
          summary: '等待AI分析...',
          reasons: []
        },
        isNotified: false,
        metadata: hotspot.metadata || {}
      });

      await newHotspot.save();
      savedHotspots.push(newHotspot);

      // 发送邮件通知（异步，不阻塞保存流程）
      sendHotspotEmailNotification(userId, newHotspot).catch(err => {
        console.error('邮件通知发送失败:', err.message);
      });

    } catch (error) {
      console.error('保存热点失败:', hotspot.title, error.message);
    }
  }

  return { savedHotspots, skippedUrls };
}

/**
 * 发送热点邮件通知
 */
async function sendHotspotEmailNotification(userId, hotspot) {
  try {
    // 获取用户信息和设置
    const user = await User.findById(userId);
    if (!user) {
      console.log('用户不存在，跳过邮件通知');
      return;
    }

    // 检查用户是否启用了邮件通知（settings.notificationEmail 默认为 true）
    const emailNotificationEnabled = user.settings?.notificationEmail !== false;
    if (!emailNotificationEnabled) {
      console.log('用户已禁用邮件通知，跳过发送');
      return;
    }

    // 获取通知邮箱（优先使用配置的通知邮箱，否则使用注册邮箱）
    const toEmail = user.notificationEmail || user.email;

    // 发送邮件
    await sendHotspotEmail(toEmail, hotspot);

    // 标记热点已发送通知
    await Hotspot.findByIdAndUpdate(hotspot._id, { isNotified: true });

    console.log(`✅ 邮件通知已发送给用户 ${user.email}: ${hotspot.title}`);
  } catch (error) {
    console.error('发送热点邮件通知失败:', error.message);
  }
}

module.exports = {
  initWebSocketServer,
  sendToUser,
  broadcast,
  sendScanProgress,
  sendAnalysisResult,
  sendScanComplete,
  sendScanError,
  processAIAnalysis,
  batchSaveHotspots,
  saveUniqueHotspots,
  clients
};
