import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notification.controller';

const router = express.Router();

// 获取用户所有通知
router.get('/', getNotifications);

// 标记通知为已读
router.put('/:id/read', markAsRead);

// 标记所有通知为已读
router.put('/mark-all-read', markAllAsRead);

// 删除通知
router.delete('/:id', deleteNotification);

export default router;