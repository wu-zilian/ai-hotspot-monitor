const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
let authToken = '';
let testUserId = '';
let testTaskId = '';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log('\n' + '='.repeat(60));
  log(`测试: ${testName}`, 'blue');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'yellow');
}

// 测试1: 用户登录获取token
async function testLogin() {
  logTest('用户登录');

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    if (response.data.token) {
      authToken = response.data.token;
      testUserId = response.data.user._id;
      logSuccess(`登录成功，获取到token: ${authToken.substring(0, 20)}...`);
      logInfo(`用户ID: ${testUserId}`);
      logInfo(`用户名: ${response.data.user.username}`);
      return true;
    } else {
      logError('登录失败：未获取到token');
      return false;
    }
  } catch (error) {
    logError(`登录请求失败: ${error.message}`);
    if (error.response) {
      logError(`响应状态: ${error.response.status}`);
      logError(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 测试2: 创建测试任务
async function testCreateTask() {
  logTest('创建测试任务');

  try {
    const response = await axios.post(`${BASE_URL}/api/tasks`, {
      name: `历史记录测试任务_${Date.now()}`,
      schedule: '*/30 * * * *',
      keywords: ['测试', '历史记录'],
      isActive: true
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.data._id) {
      testTaskId = response.data._id;
      logSuccess(`任务创建成功，ID: ${testTaskId}`);
      logInfo(`任务名称: ${response.data.name}`);
      logInfo(`关键词: ${response.data.keywords.join(', ')}`);
      return true;
    } else {
      logError('任务创建失败');
      return false;
    }
  } catch (error) {
    logError(`创建任务失败: ${error.message}`);
    if (error.response) {
      logError(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 测试3: 获取扫描历史列表（基本测试）
async function testGetScanHistory() {
  logTest('获取扫描历史列表');

  try {
    const response = await axios.get(`${BASE_URL}/api/tasks/history`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    logSuccess(`成功获取历史记录，数量: ${response.data.length || response.data.count || response.data.total || '未知'}`);

    if (response.data.length > 0) {
      logInfo('第一条记录:');
      console.log(JSON.stringify(response.data[0], null, 2));
    } else {
      logInfo('历史记录为空');
    }

    return response.data;
  } catch (error) {
    logError(`获取历史记录失败: ${error.message}`);
    if (error.response) {
      logError(`响应状态: ${error.response.status}`);
      logError(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

// 测试4: 测试分页功能
async function testPagination() {
  logTest('测试分页功能');

  try {
    // 测试第一页
    const response1 = await axios.get(`${BASE_URL}/api/tasks/history?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    logSuccess('分页测试 - 第1页:');
    logInfo(`响应数据结构: ${JSON.stringify(Object.keys(response1.data))}`);

    if (response1.data.data) {
      logInfo(`数据条数: ${response1.data.data.length}`);
      if (response1.data.pagination) {
        logInfo(`分页信息: ${JSON.stringify(response1.data.pagination)}`);
      }
    } else if (Array.isArray(response1.data)) {
      logInfo(`数据条数: ${response1.data.length}`);
    }

    // 测试第二页
    const response2 = await axios.get(`${BASE_URL}/api/tasks/history?page=2&limit=5`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    logSuccess('分页测试 - 第2页（每页5条）:');
    if (response2.data.data) {
      logInfo(`数据条数: ${response2.data.data.length}`);
    } else if (Array.isArray(response2.data)) {
      logInfo(`数据条数: ${response2.data.length}`);
    }

    return true;
  } catch (error) {
    logError(`分页测试失败: ${error.message}`);
    if (error.response) {
      logError(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 测试5: 测试日期筛选
async function testDateFilter() {
  logTest('测试日期筛选功能');

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const formatDate = (date) => date.toISOString().split('T')[0];

  try {
    // 测试今天的数据
    logInfo('测试今天的记录...');
    const response1 = await axios.get(`${BASE_URL}/api/tasks/history?startDate=${formatDate(today)}&endDate=${formatDate(today)}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    logSuccess(`今天的记录: ${response1.data.length || response1.data.count || response1.data.total || Array.isArray(response1.data) ? response1.data.length : 0} 条`);

    // 测试最近7天的数据
    logInfo('测试最近7天的记录...');
    const response2 = await axios.get(`${BASE_URL}/api/tasks/history?startDate=${formatDate(lastWeek)}&endDate=${formatDate(today)}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    logSuccess(`最近7天的记录: ${response2.data.length || response2.data.count || response2.data.total || Array.isArray(response2.data) ? response2.data.length : 0} 条`);

    return true;
  } catch (error) {
    logError(`日期筛选测试失败: ${error.message}`);
    if (error.response) {
      logError(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 测试6: 测试状态筛选
async function testStatusFilter() {
  logTest('测试状态筛选功能');

  try {
    // 测试成功状态
    logInfo('测试筛选成功状态的记录...');
    const response1 = await axios.get(`${BASE_URL}/api/tasks/history?status=success`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    logSuccess(`成功状态的记录: ${response1.data.length || response1.data.count || response1.data.total || Array.isArray(response1.data) ? response1.data.length : 0} 条`);

    // 测试失败状态
    logInfo('测试筛选失败状态的记录...');
    const response2 = await axios.get(`${BASE_URL}/api/tasks/history?status=failed`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    logSuccess(`失败状态的记录: ${response2.data.length || response2.data.count || response2.data.total || Array.isArray(response2.data) ? response2.data.length : 0} 条`);

    // 测试运行中状态
    logInfo('测试筛选运行中状态的记录...');
    const response3 = await axios.get(`${BASE_URL}/api/tasks/history?status=running`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    logSuccess(`运行中状态的记录: ${response3.data.length || response3.data.count || response3.data.total || Array.isArray(response3.data) ? response3.data.length : 0} 条`);

    return true;
  } catch (error) {
    logError(`状态筛选测试失败: ${error.message}`);
    if (error.response) {
      logError(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 测试7: 获取任务详情
async function testGetTaskDetail() {
  logTest('获取任务详情');

  try {
    const response = await axios.get(`${BASE_URL}/api/tasks/scan/${testTaskId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    logSuccess('成功获取任务详情:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    logError(`获取任务详情失败: ${error.message}`);
    if (error.response) {
      logError(`响应状态: ${error.response.status}`);
      logError(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 测试8: 触发任务执行（生成历史记录）
async function testTriggerTask() {
  logTest('触发任务执行');

  try {
    const response = await axios.post(`${BASE_URL}/api/tasks/${testTaskId}/trigger`, {}, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    logSuccess('任务触发成功');
    logInfo(`响应: ${JSON.stringify(response.data)}`);

    // 等待一段时间让任务执行
    logInfo('等待5秒让任务执行...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    return true;
  } catch (error) {
    logError(`触发任务失败: ${error.message}`);
    if (error.response) {
      logError(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 测试9: 测试组合筛选
async function testCombinedFilters() {
  logTest('测试组合筛选功能');

  const today = new Date();
  const formatDate = (date) => date.toISOString().split('T')[0];

  try {
    // 日期 + 状态 + 分页
    const response = await axios.get(`${BASE_URL}/api/tasks/history?startDate=${formatDate(today)}&status=success&page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    logSuccess('组合筛选（日期+状态+分页）:');
    logInfo(`查询参数: startDate=${formatDate(today)}, status=success, page=1, limit=5`);

    if (response.data.data) {
      logInfo(`数据条数: ${response.data.data.length}`);
      if (response.data.pagination) {
        logInfo(`分页信息: ${JSON.stringify(response.data.pagination)}`);
      }
    } else if (Array.isArray(response.data)) {
      logInfo(`数据条数: ${response.data.length}`);
    }

    return true;
  } catch (error) {
    logError(`组合筛选测试失败: ${error.message}`);
    if (error.response) {
      logError(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 主测试函数
async function runTests() {
  log('🚀 开始测试AI热点监控系统历史记录功能', 'blue');
  log('='.repeat(60), 'blue');

  const results = {
    login: false,
    createTask: false,
    getHistory: false,
    pagination: false,
    dateFilter: false,
    statusFilter: false,
    taskDetail: false,
    triggerTask: false,
    combinedFilters: false
  };

  // 执行测试
  results.login = await testLogin();

  if (results.login) {
    results.createTask = await testCreateTask();

    if (results.createTask) {
      results.triggerTask = await testTriggerTask();
    }

    results.getHistory = await testGetScanHistory();
    results.pagination = await testPagination();
    results.dateFilter = await testDateFilter();
    results.statusFilter = await testStatusFilter();
    results.combinedFilters = await testCombinedFilters();

    if (testTaskId) {
      results.taskDetail = await testGetTaskDetail();
    }
  }

  // 输出测试结果摘要
  console.log('\n' + '='.repeat(60));
  log('📊 测试结果摘要', 'blue');
  console.log('='.repeat(60));

  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✓ 通过' : '✗ 失败';
    const color = result ? 'green' : 'red';
    log(`${test.padEnd(20)}: ${status}`, color);
  });

  const passedTests = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log('\n' + '='.repeat(60));
  log(`总计: ${passedTests}/${totalTests} 测试通过 (${successRate}%)`,
    passedTests === totalTests ? 'green' : 'yellow');
  console.log('='.repeat(60));

  return results;
}

// 运行测试
runTests()
  .then(results => {
    const allPassed = Object.values(results).every(r => r);
    process.exit(allPassed ? 0 : 1);
  })
  .catch(error => {
    logError(`测试运行出错: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
