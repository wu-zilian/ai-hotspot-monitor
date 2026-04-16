const Hotspot = require('../models/Hotspot');
const Keyword = require('../models/Keyword');
const { analyzeWithAI } = require('../services/ai.service');

exports.getHotspots = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { limit = 50, offset = 0 } = req.query;

    // 获取用户的关键词
    const keywords = await Keyword.find({ userId, isActive: true });
    const keywordNames = keywords.map(k => k.name);

    // 获取用户的所有热点（不按关键词过滤，因为关键词已保存在热点中）
    const query = { userId };

    const hotspots = await Hotspot.find(query)
      .sort({ createdAt: -1 })  // 按创建时间降序
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: hotspots,
      total: hotspots.length,
      keywords: keywordNames
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取热点失败',
      error: error.message
    });
  }
};

exports.analyzeContent = async (req, res) => {
  try {
    const { content, source } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '内容不能为空'
      });
    }

    // 调用AI分析服务
    const analysis = await analyzeWithAI(content, source || 'unknown');

    // 保存分析结果到数据库
    const hotspot = new Hotspot({
      userId: req.user?.userId,
      title: content.substring(0, 100),
      content: content.substring(0, 500),
      source: source || 'user',
      url: '',
      timestamp: new Date(),
      isVerified: analysis.isAuthentic,
      confidence: analysis.confidence,
      keywords: [],
      analysis: {
        summary: analysis.summary,
        reasons: analysis.reasons
      },
      isNotified: false
    });

    await hotspot.save();

    res.json({
      success: true,
      data: analysis,
      hotspotId: hotspot._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '分析失败',
      error: error.message
    });
  }
};

exports.triggerManualScan = async (req, res) => {
  try {
    const userId = req.user?.userId;

    // 获取用户的关键词
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

    // 模拟扫描结果（实际应该调用爬虫服务）
    const mockHotspots = [
      {
        _id: '1',
        title: 'OpenAI发布新模型',
        content: '最新的大型语言模型性能提升显著...',
        source: 'TechCrunch',
        url: 'https://techcrunch.com/example',
        timestamp: new Date(),
        isVerified: true,
        confidence: 92,
        keywords: ['AI', 'OpenAI']
      },
      {
        _id: '2',
        title: 'Google推出AI编程助手',
        content: '新的代码助手支持多种编程语言...',
        source: 'VentureBeat',
        url: 'https://venturebeat.com/example',
        timestamp: new Date(Date.now() - 3600000),
        isVerified: true,
        confidence: 88,
        keywords: ['Google', 'AI', '编程']
      }
    ];

    res.json({
      success: true,
      message: '扫描任务已启动',
      data: mockHotspots,
      keywords: keywordNames,
      scanStarted: true,
      scanTime: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '启动扫描失败',
      error: error.message
    });
  }
};
