const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createTestNotification
} = require('../controllers/notification.controller');

const router = express.Router();

// 创建测试通知
router.post('/test', createTestNotification);

// 获取未读通知计数
router.get('/unread-count', getUnreadCount);

// 标记所有通知为已读 (必须在 /:id/read 之前)
router.put('/read-all', markAllAsRead);
router.put('/mark-all-read', markAllAsRead);

// 获取用户所有通知
router.get('/', getNotifications);

// 标记单个通知为已读
router.put('/:id/read', markAsRead);

// 删除通知
router.delete('/:id', deleteNotification);

module.exports = router;
