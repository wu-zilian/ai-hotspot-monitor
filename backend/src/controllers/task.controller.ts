import { Request, Response } from 'express';
import Task from '../models/Task';
import { triggerCrawlerTask } from '../services/task.service';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find({ userId: req.user?.userId })
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

export const createTask = async (req: Request, res: Response) => {
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

export const updateTask = async (req: Request, res: Response) => {
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

export const deleteTask = async (req: Request, res: Response) => {
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

export const triggerTask = async (req: Request, res: Response) => {
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