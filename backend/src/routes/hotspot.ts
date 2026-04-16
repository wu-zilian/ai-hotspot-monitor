import express from 'express';
import {
  getHotspots,
  getHotspotById,
  verifyHotspotContent
} from '../controllers/hotspotController';

const router = express.Router();

// 获取热点列表
router.get('/', getHotspots);

// 获取单个热点详情
router.get('/:id', getHotspotById);

// 验证热点内容
router.post('/:id/verify', verifyHotspotContent);

export default router;