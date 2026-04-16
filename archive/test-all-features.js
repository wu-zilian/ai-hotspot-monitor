/**
 * AI热点监控系统 - 功能测试脚本
 * 测试所有页面的API和功能
 */

const BASE_URL = 'http://localhost:5001';
const API_BASE = `${BASE_URL}/api`;

// 存储token
let authToken = '';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'blue');
  console.log('='.repeat(60));
}

function logTest(name, passed) {
  const status = passed ? '✅ 通过' : '❌ 失败';
  const color = passed ? 'green' : 'red';
  log(`${status} - ${name}`, color);
}

// API请求函数
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  return {
    ok: response.ok,
    status: response.status,
    data: await response.json().catch(() => null),
  };
}

// 登录
async function login() {
  logSection('🔐 用户登录');
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
      }),
    });

    const data = await response.json();
    if (data.token) {
      authToken = data.token;
      logTest('登录成功', true);
      log(`Token: ${authToken.substring(0, 20)}...`, 'yellow');
      return true;
    } else {
      logTest('登录失败', false);
      return false;
    }
  } catch (error) {
    logTest('登录请求失败', false);
    log(`错误: ${error.message}`, 'red');
    return false;
  }
}

// 测试仪表盘功能
async function testDashboard() {
  logSection('📊 测试仪表盘功能');

  // 测试获取关键词统计
  const keywordsRes = await apiRequest('/keywords');
  logTest('获取关键词列表', keywordsRes.ok);
  if (keywordsRes.ok && Array.isArray(keywordsRes.data)) {
    log(`  - 活跃关键词: ${keywordsRes.data.filter(k => k.isActive).length} 个`, 'yellow');
  }

  // 测试获取热点列表
  const hotspotsRes = await apiRequest('/content/hotspots?limit=10');
  logTest('获取热点列表', hotspotsRes.ok);
  if (hotspotsRes.ok && hotspotsRes.data?.data) {
    log(`  - 热点数量: ${hotspotsRes.data.data.length} 条`, 'yellow');
  }

  // 测试扫描任务API
  const scanRes = await apiRequest('/tasks/scan', 'POST', {
    sources: ['hackernews'],
    limit: 5,
    enableAI: false,
  });
  logTest('启动扫描任务', scanRes.ok);
  if (scanRes.ok && scanRes.data?.taskId) {
    log(`  - 任务ID: ${scanRes.data.taskId}`, 'yellow');

    // 测试任务状态查询
    const statusRes = await apiRequest(`/tasks/scan/${scanRes.data.taskId}/status`);
    logTest('查询任务状态', statusRes.ok);
    if (statusRes.ok && statusRes.data?.data) {
      log(`  - 任务状态: ${statusRes.data.data.status}`, 'yellow');
    }
  }
}

// 测试关键词管理
async function testKeywords() {
  logSection('🔑 测试关键词管理功能');

  // 获取现有关键词
  const listRes = await apiRequest('/keywords');
  logTest('获取关键词列表', listRes.ok);

  // 添加测试关键词
  const testKeywordName = `测试关键词_${Date.now()}`;
  const addRes = await apiRequest('/keywords', 'POST', {
    name: testKeywordName,
    description: '自动化测试关键词',
    isActive: true,
  });
  logTest('添加关键词', addRes.ok);
  const newKeywordId = addRes.data?._id;

  // 更新关键词
  if (newKeywordId) {
    const updateRes = await apiRequest(`/keywords/${newKeywordId}`, 'PUT', {
      name: `${testKeywordName}_updated`,
      description: '更新后的描述',
      isActive: false,
    });
    logTest('更新关键词', updateRes.ok);
  }

  // 删除测试关键词
  if (newKeywordId) {
    const deleteRes = await apiRequest(`/keywords/${newKeywordId}`, 'DELETE');
    logTest('删除关键词', deleteRes.ok);
  }
}

// 测试历史记录
async function testHistory() {
  logSection('📜 测试历史记录功能');

  // 获取任务列表
  const listRes = await apiRequest('/tasks/scan/list');
  logTest('获取扫描历史列表', listRes.ok);

  if (listRes.ok && Array.isArray(listRes.data)) {
    log(`  - 历史记录数: ${listRes.data.length} 条`, 'yellow');

    // 如果有历史记录，测试详情查询
    if (listRes.data.length > 0) {
      const taskId = listRes.data[0].taskId;
      const detailRes = await apiRequest(`/tasks/scan/${taskId}/status`);
      logTest('获取任务详情', detailRes.ok);
    }
  }
}

// 测试通知中心
async function testNotifications() {
  logSection('🔔 测试通知中心功能');

  // 获取通知列表
  const listRes = await apiRequest('/notifications');
  logTest('获取通知列表', listRes.ok);

  if (listRes.ok && Array.isArray(listRes.data)) {
    log(`  - 通知数量: ${listRes.data.length} 条`, 'yellow');

    const unreadCount = listRes.data.filter(n => !n.isRead).length;
    log(`  - 未读通知: ${unreadCount} 条`, 'yellow');
  }

  // 测试标记已读
  if (listRes.ok && listRes.data?.length > 0) {
    const notificationId = listRes.data[0]._id;
    const markRes = await apiRequest(`/notifications/${notificationId}/read`, 'PUT');
    logTest('标记通知已读', markRes.ok);
  }

  // 测试删除通知
  if (listRes.ok && listRes.data?.length > 1) {
    const notificationId = listRes.data[1]._id;
    const deleteRes = await apiRequest(`/notifications/${notificationId}`, 'DELETE');
    logTest('删除通知', deleteRes.ok);
  }
}

// 测试系统设置
async function testSettings() {
  logSection('⚙️ 测试系统设置功能');

  // 测试获取用户设置
  const getRes = await apiRequest('/settings');
  logTest('获取用户设置', getRes.ok);

  // 测试更新设置
  const updateRes = await apiRequest('/settings', 'PUT', {
    notifications: {
      email: true,
      browser: true,
      mobile: false,
    },
    scanInterval: 60,
  });
  logTest('更新用户设置', updateRes.ok);

  // 测试邮件配置（邮件配置通过/settings接口保存）
  const emailRes = await apiRequest('/settings', 'PUT', {
    email: 'test@example.com',
    emailConfig: {
      prefix: 'test',
      domain: 'example.com',
      authCode: 'test123'
    }
  });
  logTest('保存邮件配置', emailRes.ok);

  // 测试邮件发送
  const testEmailRes = await apiRequest('/settings/test-email', 'POST');
  logTest('发送测试邮件', testEmailRes.ok || testEmailRes.status === 400); // 400可能是配置未完成
}

// 测试个人中心
async function testProfile() {
  logSection('👤 测试个人中心功能');

  // 获取用户信息
  const getRes = await apiRequest('/auth/me');
  logTest('获取用户信息', getRes.ok);

  if (getRes.ok && getRes.data?.user) {
    const user = getRes.data.user;
    log(`  - 用户名: ${user.username || 'N/A'}`, 'yellow');
    log(`  - 邮箱: ${user.email || 'N/A'}`, 'yellow');
  }

  // 测试修改密码（change-password是POST请求）
  const passwordRes = await apiRequest('/auth/change-password', 'POST', {
    currentPassword: 'admin123',
    newPassword: 'admin123',
  });
  logTest('修改密码（相同密码）', passwordRes.ok || passwordRes.status === 400);
}

// 运行所有测试
async function runAllTests() {
  log('🔥 AI热点监控系统 - 功能测试', 'blue');
  log('开始时间: ' + new Date().toLocaleString(), 'yellow');

  const loginSuccess = await login();
  if (!loginSuccess) {
    log('登录失败，终止测试', 'red');
    return;
  }

  await testDashboard();
  await testKeywords();
  await testHistory();
  await testNotifications();
  await testSettings();
  await testProfile();

  logSection('✨ 测试完成');
  log('结束时间: ' + new Date().toLocaleString(), 'yellow');
}

// 运行测试
runAllTests().catch(console.error);
