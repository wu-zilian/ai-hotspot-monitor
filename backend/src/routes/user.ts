import express from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
  deleteUser
} from '../controllers/userController';

const router = express.Router();

// 用户注册
router.post('/register', registerUser);

// 用户登录
router.post('/login', loginUser);

// 获取当前用户信息
router.get('/me', getCurrentUser);

// 更新用户资料
router.put('/me', updateUserProfile);

// 删除用户
router.delete('/:id', deleteUser);

export default router;