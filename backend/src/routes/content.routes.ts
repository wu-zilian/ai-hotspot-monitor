import express from 'express';
import {
  getHotspots,
  analyzeContent,
  triggerManualScan,
  deleteHotspot
} from '../controllers/content.controller';

const router = express.Router();

// 获取热点内容
router.get('/hotspots', getHotspots);

// 分析内容真实性
router.post('/analyze', analyzeContent);

// 手动触发扫描
router.post('/scan', triggerManualScan);

// 删除热点
router.delete('/hotspots/:id', deleteHotspot);

export default router;