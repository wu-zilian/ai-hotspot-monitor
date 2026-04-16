const express = require('express');
const {
  getHotspots,
  analyzeContent,
  triggerManualScan
} = require('../controllers/content.controller');

const router = express.Router();

// 获取热点内容
router.get('/hotspots', getHotspots);

// 分析内容真实性
router.post('/analyze', analyzeContent);

// 手动触发扫描
router.post('/scan', triggerManualScan);

module.exports = router;
