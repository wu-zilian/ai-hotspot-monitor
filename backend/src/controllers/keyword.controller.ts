import { Request, Response } from 'express';
import Keyword from '../models/Keyword';
import { IKeyword } from '../models/Keyword';

export const getKeywords = async (req: Request, res: Response) => {
  try {
    const keywords = await Keyword.find({ userId: req.user?.userId })
      .sort({ createdAt: -1 });
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

export const createKeyword = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = req.user?.userId;

    // 检查关键词是否已存在
    const existingKeyword = await Keyword.findOne({
      userId,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingKeyword) {
      return res.status(400).json({ message: '该关键词已存在' });
    }

    const keyword: IKeyword = new Keyword({
      userId,
      name,
      description
    });

    await keyword.save();
    res.status(201).json(keyword);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

export const getKeywordById = async (req: Request, res: Response) => {
  try {
    const keyword = await Keyword.findOne({
      _id: req.params.id,
      userId: req.user?.userId
    });

    if (!keyword) {
      return res.status(404).json({ message: '关键词不存在' });
    }

    res.json(keyword);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

export const updateKeyword = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const keyword = await Keyword.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.userId },
      { name, description },
      { new: true }
    );

    if (!keyword) {
      return res.status(404).json({ message: '关键词不存在' });
    }

    res.json(keyword);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

export const deleteKeyword = async (req: Request, res: Response) => {
  try {
    const keyword = await Keyword.findOneAndDelete({
      _id: req.params.id,
      userId: req.user?.userId
    });

    if (!keyword) {
      return res.status(404).json({ message: '关键词不存在' });
    }

    res.json({ message: '关键词删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};