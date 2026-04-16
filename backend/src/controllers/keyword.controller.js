const Keyword = require('../models/Keyword');

exports.getKeywords = async (req, res) => {
  try {
    const keywords = await Keyword.find({ userId: req.user?.userId })
      .sort({ createdAt: -1 });
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

exports.createKeyword = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const userId = req.user?.userId;

    // 检查关键词是否已存在
    const existingKeyword = await Keyword.findOne({
      userId,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingKeyword) {
      return res.status(400).json({ message: '该关键词已存在' });
    }

    const keyword = new Keyword({
      userId,
      name,
      description,
      isActive: isActive !== false  // 默认激活
    });

    await keyword.save();

    // 刷新用户的自动扫描任务
    const autoScanScheduler = require('../services/autoScan.scheduler');
    await autoScanScheduler.refreshUserTask(userId);

    res.status(201).json(keyword);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

exports.getKeywordById = async (req, res) => {
  try {
    const keyword = await Keyword.findOne({
      _id: req.params.id,
      userId: req.user?.userId
    });

    if (!keyword) {
      return res.status(404).json({ message: '关键词不存在' });
    }

    res.json(keyword);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

exports.updateKeyword = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const userId = req.user?.userId;

    const keyword = await Keyword.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.userId },
      { name, description, isActive },
      { new: true }
    );

    if (!keyword) {
      return res.status(404).json({ message: '关键词不存在' });
    }

    // 刷新用户的自动扫描任务
    const autoScanScheduler = require('../services/autoScan.scheduler');
    await autoScanScheduler.refreshUserTask(userId);

    res.json(keyword);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

exports.deleteKeyword = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const keyword = await Keyword.findOneAndDelete({
      _id: req.params.id,
      userId
    });

    if (!keyword) {
      return res.status(404).json({ message: '关键词不存在' });
    }

    // 刷新用户的自动扫描任务
    const autoScanScheduler = require('../services/autoScan.scheduler');
    await autoScanScheduler.refreshUserTask(userId);

    res.json({ message: '关键词删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};
