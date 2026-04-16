import { Request, Response } from 'express';
import Notification from '../models/Notification';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await Notification.find({ userId: req.user?.userId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: '通知不存在' });
    }

    res.json({ message: '通知已标记为已读' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    await Notification.updateMany(
      { userId: req.user?.userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: '所有通知已标记为已读' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user?.userId
    });

    if (!notification) {
      return res.status(404).json({ message: '通知不存在' });
    }

    res.json({ message: '通知删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};