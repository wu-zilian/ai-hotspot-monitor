const express = require('express');
const { register, login, logout, getCurrentUser, getProfile, updateProfile, changePassword } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// 用户注册
router.post('/register', register);

// 用户登录
router.post('/login', login);

// 用户登出
router.post('/logout', logout);

// 获取当前用户信息（需要认证）
router.get('/me', authMiddleware, getCurrentUser);

// 获取用户详细信息（个人中心）
router.get('/profile', authMiddleware, getProfile);

// 更新用户信息（个人中心）
router.put('/profile', authMiddleware, updateProfile);

// 修改密码
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;
