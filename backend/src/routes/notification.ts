import express from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  sendNotification
} from '../controllers/notificationController';

const router = express.Router();

// 获取通知列表
router.get('/', getNotifications);

// 标记通知为已读
router.put('/:id/read', markNotificationAsRead);

// 发送通知
router.post('/send', sendNotification);

export default router;