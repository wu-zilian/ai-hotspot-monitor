import express from 'express';
import userRoutes from './user';
import keywordRoutes from './keyword';
import hotspotRoutes from './hotspot';
import notificationRoutes from './notification';

const router = express.Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API路由
router.use('/api/users', userRoutes);
router.use('/api/keywords', keywordRoutes);
router.use('/api/hotspots', hotspotRoutes);
router.use('/api/notifications', notificationRoutes);

export default router;