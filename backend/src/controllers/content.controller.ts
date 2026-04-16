import { Request, Response } from 'express';
import Hotspot from '../models/Hotspot';
import Keyword from '../models/Keyword';
import { analyzeWithAI } from '../services/ai.service';

export const getHotspots = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { limit = 50, offset = 0 } = req.query;

    // 获取用户的关键词
    const keywords = await Keyword.find({ userId, isActive: true });
    const keywordNames = keywords.map(k => k.name);

    // 获取相关热点
    const query: any = { userId };
    if (keywordNames.length > 0) {
      query.$or = keywordNames.map(name => ({
        title: { $regex: name, $options: 'i' }
      }));
    }

    const hotspots = await Hotspot.find(query)
      .sort({ timestamp: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string));

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

export const analyzeContent = async (req: Request, res: Response) => {
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

export const triggerManualScan = async (req: Request, res: Response) => {
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

export const deleteHotspot = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    // 查找热点并确认属于该用户
    const hotspot = await Hotspot.findOne({ _id: id, userId });

    if (!hotspot) {
      return res.status(404).json({
        success: false,
        message: '热点不存在或无权删除'
      });
    }

    await Hotspot.deleteOne({ _id: id, userId });

    res.json({
      success: true,
      message: '热点删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除失败',
      error: error.message
    });
  }
};