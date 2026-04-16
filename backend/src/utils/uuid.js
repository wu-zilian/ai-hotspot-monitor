/**
 * 简单的UUID v4生成器
 * 替代uuid包，避免依赖问题
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 生成短ID（用于任务ID等）
 */
function shortId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = {
  v4: uuidv4,
  uuidv4,
  shortId
};
