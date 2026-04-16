import { Request, Response } from 'express';
import Keyword from '../models/Keyword';
import { validationResult } from 'express-validator';

// 获取用户关键词列表
export const getKeywords = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const keywords = await Keyword.find({ userId, isActive: true })
      .sort({ createdAt: -1 });

    res.json(keywords);
  } catch (error) {
    console.error('获取关键词列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建新关键词
export const createKeyword = async (req: Request, res: Response) => {
  try {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const userId = req.user?.userId;

    // 检查关键词是否已存在
    const existingKeyword = await Keyword.findOne({ userId, name, isActive: true });
    if (existingKeyword) {
      return res.status(400).json({ message: '该关键词已存在' });
    }

    // 创建新关键词
    const keyword = new Keyword({
      userId,
      name,
      description
    });

    await keyword.save();

    res.status(201).json(keyword);
  } catch (error) {
    console.error('创建关键词错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新关键词
export const updateKeyword = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const keywordId = req.params.id;
    const userId = req.user?.userId;

    const keyword = await Keyword.findOne({ _id: keywordId, userId });
    if (!keyword) {
      return res.status(404).json({ message: '关键词不存在' });
    }

    // 检查名称是否已被其他关键词使用
    if (name && name !== keyword.name) {
      const existingKeyword = await Keyword.findOne({ userId, name, isActive: true, _id: { $ne: keywordId } });
      if (existingKeyword) {
        return res.status(400).json({ message: '该关键词名称已被使用' });
      }
    }

    // 更新关键词
    keyword.name = name || keyword.name;
    keyword.description = description || keyword.description;

    await keyword.save();

    res.json(keyword);
  } catch (error) {
    console.error('更新关键词错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除关键词
export const deleteKeyword = async (req: Request, res: Response) => {
  try {
    const keywordId = req.params.id;
    const userId = req.user?.userId;

    const keyword = await Keyword.findOne({ _id: keywordId, userId });
    if (!keyword) {
      return res.status(404).json({ message: '关键词不存在' });
    }

    // 软删除（标记为非活跃）
    keyword.isActive = false;
    await keyword.save();

    res.json({ message: '关键词删除成功' });
  } catch (error) {
    console.error('删除关键词错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};