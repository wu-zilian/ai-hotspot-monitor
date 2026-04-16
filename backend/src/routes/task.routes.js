const express = require('express');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  triggerTask,
  triggerManualScan,
  getScanTaskStatus,
  getScanTasks,
  cancelScanTask,
  getAvailableSources,
  getScanHistory,
  getScanTaskDetail
} = require('../controllers/task.controller');

const router = express.Router();

// 定时任务相关
router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/trigger', triggerTask);

// 历史记录相关（注意：history路径要放在 :taskId 之前）
router.get('/history', getScanHistory);           // 获取扫描历史记录

// 异步扫描相关（注意：更具体的路径要放在前面）
router.post('/scan', triggerManualScan);                 // 启动异步扫描
router.get('/scan/list', getScanTasks);                  // 获取扫描任务列表
router.get('/scan/:taskId/status', getScanTaskStatus);   // 获取扫描任务状态
router.get('/scan/:taskId', getScanTaskDetail);          // 获取扫描任务详情
router.delete('/scan/:taskId', cancelScanTask);          // 取消扫描任务

// 信息源相关（注意：这个路由要放在最后，避免与上面的冲突）
router.get('/sources/available', getAvailableSources);

module.exports = router;
