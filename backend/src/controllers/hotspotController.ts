import { Request, Response } from 'express';
import Hotspot from '../models/Hotspot';
import { validationResult } from 'express-validator';

// 获取热点列表
export const getHotspots = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20, keyword, verified } = req.query;

    const query: any = { keywords: { $in: [keyword] } };
    if (verified) {
      query.isVerified = verified === 'true';
    }

    const hotspots = await Hotspot.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Hotspot.countDocuments(query);

    res.json({
      hotspots,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('获取热点列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取单个热点详情
export const getHotspotById = async (req: Request, res: Response) => {
  try {
    const hotspot = await Hotspot.findById(req.params.id);
    if (!hotspot) {
      return res.status(404).json({ message: '热点内容不存在' });
    }

    res.json(hotspot);
  } catch (error) {
    console.error('获取热点详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 验证热点内容
export const verifyHotspotContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isVerified, verifiedBy } = req.body;

    const hotspot = await Hotspot.findById(id);
    if (!hotspot) {
      return res.status(404).json({ message: '热点内容不存在' });
    }

    hotspot.isVerified = isVerified;
    hotspot.verifiedBy = verifiedBy;
    hotspot.verifiedAt = new Date();

    await hotspot.save();

    res.json({
      message: '热点内容验证成功',
      hotspot
    });
  } catch (error) {
    console.error('验证热点内容错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};