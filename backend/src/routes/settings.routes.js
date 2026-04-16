const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const settingsController = require('../controllers/settings.controller');

// 所有设置路由都需要认证
router.use(authMiddleware);

// 获取设置
router.get('/', settingsController.getSettings);

// 更新设置
router.put('/', settingsController.updateSettings);

// 测试邮件
router.post('/test-email', settingsController.testEmail);

module.exports = router;
