const express = require('express');
const {
  getKeywords,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  getKeywordById
} = require('../controllers/keyword.controller');

const router = express.Router();

// 获取用户所有关键词
router.get('/', getKeywords);

// 创建新关键词
router.post('/', createKeyword);

// 获取单个关键词
router.get('/:id', getKeywordById);

// 更新关键词
router.put('/:id', updateKeyword);

// 删除关键词
router.delete('/:id', deleteKeyword);

module.exports = router;
