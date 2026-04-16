import express from 'express';
import {
  getKeywords,
  createKeyword,
  updateKeyword,
  deleteKeyword
} from '../controllers/keywordController';

const router = express.Router();

// 获取用户关键词列表
router.get('/', getKeywords);

// 创建新关键词
router.post('/', createKeyword);

// 更新关键词
router.put('/:id', updateKeyword);

// 删除关键词
router.delete('/:id', deleteKeyword);

export default router;