const Notification = require('../models/Notification');

// 创建通知的辅助函数
async function createNotification(userId, title, content, type = 'info', hotspotId = null) {
  try {
    const notification = new Notification({
      userId,
      title,
      content,
      type,
      hotspotId,
      isRead: false
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('创建通知失败:', error);
    return null;
  }
}

// 导出创建通知函数
exports.createNotification = createNotification;

// 创建测试通知
exports.createTestNotification = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { type = 'success', title, content } = req.body;

    if (!userId) {
      return res.status(401).json({ message: '用户未登录' });
    }

    // 使用默认测试内容
    const notificationTitle = title || '🔔 Web推送通知测试';
    const notificationContent = content || '这是一条测试通知，说明您的Web推送通知功能正常工作！';

    const notification = await createNotification(
      userId,
      notificationTitle,
      notificationContent,
      type
    );

    if (!notification) {
      return res.status(500).json({ message: '创建通知失败' });
    }

    res.json({
      success: true,
      message: '测试通知已创建',
      data: notification
    });
  } catch (error) {
    console.error('创建测试通知失败:', error);
    res.status(500).json({ message: '创建测试通知失败' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { type, unreadOnly } = req.query;

    const query = { userId };
    if (type) {
      query.type = type;
    }
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('获取通知失败:', error);
    res.status(500).json({ message: '获取通知失败' });
  }
};

// 获取未读通知计数
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const count = await Notification.countDocuments({
      userId,
      isRead: false
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('获取未读通知计数失败:', error);
    res.status(500).json({
      success: false,
      message: '获取未读通知计数失败'
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    res.json({
      success: true,
      message: '通知已标记为已读'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '标记失败',
      error: error.message
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: '所有通知已标记为已读',
      affectedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '标记失败',
      error: error.message
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    res.json({
      success: true,
      message: '通知删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除失败',
      error: error.message
    });
  }
};
