import express from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  triggerTask
} from '../controllers/task.controller';

const router = express.Router();

// 获取所有任务
router.get('/', getTasks);

// 创建新任务
router.post('/', createTask);

// 更新任务
router.put('/:id', updateTask);

// 删除任务
router.delete('/:id', deleteTask);

// 手动触发任务
router.post('/:id/trigger', triggerTask);

export default router;