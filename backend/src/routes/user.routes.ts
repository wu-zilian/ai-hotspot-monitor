import express from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/user.controller';

const router = express.Router();

// 用户注册
router.post('/register', register);

// 用户登录
router.post('/login', login);

// 用户登出
router.post('/logout', logout);

// 获取当前用户信息
router.get('/me', getCurrentUser);

export default router;