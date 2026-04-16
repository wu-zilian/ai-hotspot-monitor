#!/usr/bin/env node

/**
 * 关键词管理功能测试脚本
 *
 * 测试功能：
 * 1. 获取关键词列表
 * 2. 添加新关键词
 * 3. 更新关键词（启用/禁用状态）
 * 4. 删除关键词
 * 5. 获取单个关键词详情
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api/keywords';
let authToken = '';
let testKeywordId = '';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log('\n' + '='.repeat(60));
  log(`测试: ${testName}`, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// 登录获取token
async function login() {
  logTest('登录系统');

  try {
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });

    authToken = response.data.token;
    logSuccess(`登录成功，获取到token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    logError(`登录失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 测试1：获取关键词列表
async function testGetKeywords() {
  logTest('获取关键词列表');

  try {
    const response = await axios.get(API_BASE, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('获取关键词列表成功');
    logInfo(`状态码: ${response.status}`);
    logInfo(`关键词数量: ${response.data.data?.length || response.data.length || 0}`);

    if (response.data.data?.length > 0 || response.data.length > 0) {
      const keywords = response.data.data || response.data;
      logInfo('现有关键词列表:');
      keywords.forEach((kw, index) => {
        console.log(`  ${index + 1}. ${kw.name} (ID: ${kw._id}, 状态: ${kw.isActive ? '启用' : '禁用'})`);
        testKeywordId = kw._id; // 保存一个ID用于后续测试
      });
    } else {
      logInfo('当前没有关键词');
    }

    return response.data;
  } catch (error) {
    logError(`获取关键词列表失败: ${error.response?.data?.message || error.message}`);
    if (error.response?.status === 401) {
      logError('认证失败，请检查token是否有效');
    }
    return null;
  }
}

// 测试2：添加新关键词
async function testCreateKeyword() {
  logTest('添加新关键词');

  const testKeywords = [
    { name: '人工智能', description: 'AI相关热点监控' },
    { name: '机器学习', description: '机器学习技术发展' },
    { name: '区块链', description: '区块链技术和应用', isActive: false },
    { name: 'COVID-19', description: '疫情相关监控' }
  ];

  const createdIds = [];

  for (const keyword of testKeywords) {
    try {
      const response = await axios.post(API_BASE, keyword, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      logSuccess(`添加关键词 "${keyword.name}" 成功`);
      logInfo(`ID: ${response.data.data?._id || response.data._id}`);
      logInfo(`状态: ${response.data.data?.isActive ?? response.data.isActive ? '启用' : '禁用'}`);

      if (response.data.data?._id) {
        createdIds.push(response.data.data._id);
      } else if (response.data._id) {
        createdIds.push(response.data._id);
      }
    } catch (error) {
      logError(`添加关键词 "${keyword.name}" 失败: ${error.response?.data?.message || error.message}`);
    }
  }

  return createdIds;
}

// 测试3：更新关键词状态
async function testUpdateKeyword(keywordId) {
  logTest('更新关键词状态');

  if (!keywordId) {
    logInfo('没有可用的关键词ID，跳过更新测试');
    return false;
  }

  try {
    // 先获取当前状态
    const getResponse = await axios.get(`${API_BASE}/${keywordId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const currentStatus = getResponse.data.data?.enabled ?? getResponse.data.enabled ?? true;
    logInfo(`当前状态: ${currentStatus ? '启用' : '禁用'}`);

    // 切换状态
    const newStatus = !currentStatus;
    const updateResponse = await axios.put(`${API_BASE}/${keywordId}`, {
      isActive: newStatus
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess(`更新关键词状态成功: ${currentStatus ? '启用→禁用' : '禁用→启用'}`);
    logInfo(`新状态: ${updateResponse.data.data?.isActive ?? updateResponse.data.isActive ? '启用' : '禁用'}`);

    return true;
  } catch (error) {
    logError(`更新关键词状态失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 测试4：获取单个关键词详情
async function testGetKeywordById(keywordId) {
  logTest('获取单个关键词详情');

  if (!keywordId) {
    logInfo('没有可用的关键词ID，跳过详情查询测试');
    return null;
  }

  try {
    const response = await axios.get(`${API_BASE}/${keywordId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('获取关键词详情成功');
    const keyword = response.data.data || response.data;
    logInfo(`关键词: ${keyword.name}`);
    logInfo(`描述: ${keyword.description || '未设置'}`);
    logInfo(`状态: ${keyword.isActive ? '启用' : '禁用'}`);
    logInfo(`创建时间: ${keyword.createdAt || new Date().toLocaleString()}`);

    return response.data;
  } catch (error) {
    logError(`获取关键词详情失败: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// 测试5：删除关键词
async function testDeleteKeyword(keywordId) {
  logTest('删除关键词');

  if (!keywordId) {
    logInfo('没有可用的关键词ID，跳过删除测试');
    return false;
  }

  try {
    // 确认关键词存在
    await axios.get(`${API_BASE}/${keywordId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    // 执行删除
    const response = await axios.delete(`${API_BASE}/${keywordId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('删除关键词成功');
    logInfo(`已删除ID: ${keywordId}`);

    // 验证删除
    try {
      await axios.get(`${API_BASE}/${keywordId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logError('关键词未被正确删除');
      return false;
    } catch (verifyError) {
      if (verifyError.response?.status === 404) {
        logSuccess('确认关键词已被删除');
        return true;
      }
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logError('关键词不存在');
    } else {
      logError(`删除关键词失败: ${error.response?.data?.message || error.message}`);
    }
    return false;
  }
}

// 测试6：批量操作测试
async function testBatchOperations() {
  logTest('批量操作测试');

  try {
    // 创建多个关键词
    logInfo('批量创建关键词...');
    const batchKeywords = [
      { name: 'Python', description: 'Python编程语言' },
      { name: 'JavaScript', description: 'JavaScript开发' },
      { name: 'React', description: 'React框架' },
      { name: 'Vue', description: 'Vue.js框架' }
    ];
    const createdIds = [];

    for (const kw of batchKeywords) {
      try {
        const response = await axios.post(API_BASE, kw, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const id = response.data.data?._id || response.data._id;
        createdIds.push({ name: kw.name, id });
        logSuccess(`创建 "${kw.name}" 成功 (ID: ${id})`);
      } catch (error) {
        logError(`创建 "${kw.name}" 失败`);
      }
    }

    // 批量更新状态
    logInfo('批量禁用关键词...');
    for (const { name, id } of createdIds) {
      try {
        await axios.put(`${API_BASE}/${id}`, { isActive: false }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        logSuccess(`禁用 "${name}" 成功`);
      } catch (error) {
        logError(`禁用 "${name}" 失败`);
      }
    }

    // 批量删除
    logInfo('批量删除关键词...');
    for (const { name, id } of createdIds) {
      try {
        await axios.delete(`${API_BASE}/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        logSuccess(`删除 "${name}" 成功`);
      } catch (error) {
        logError(`删除 "${name}" 失败`);
      }
    }

    return true;
  } catch (error) {
    logError(`批量操作失败: ${error.message}`);
    return false;
  }
}

// 测试7：参数验证测试
async function testValidation() {
  logTest('参数验证测试');

  // 测试空关键词
  logInfo('测试空关键词...');
  try {
    await axios.post(API_BASE, { name: '' }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logError('应该拒绝空关键词，但没有');
  } catch (error) {
    logSuccess('正确拒绝了空关键词');
  }

  // 测试重复关键词
  logInfo('测试重复关键词...');
  try {
    // 先创建一个
    const createResponse = await axios.post(API_BASE, { name: 'unique_test_keyword', description: 'test' }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    // 尝试创建相同的
    await axios.post(API_BASE, { name: 'unique_test_keyword', description: 'test' }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logError('应该拒绝重复关键词，但没有');
  } catch (error) {
    logSuccess('正确拒绝了重复关键词');
  }

  // 清理测试关键词
  try {
    const keywords = await axios.get(API_BASE, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const allKeywords = keywords.data.data || keywords.data;
    const testKw = allKeywords.find(k => k.name === 'unique_test_keyword');
    if (testKw) {
      await axios.delete(`${API_BASE}/${testKw._id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    }
  } catch (error) {
    // 忽略清理错误
  }
}

// 主测试函数
async function runTests() {
  log('🚀 开始关键词管理功能测试', 'yellow');
  log(`API地址: ${API_BASE}`, 'blue');
  log(`测试时间: ${new Date().toLocaleString()}`, 'blue');

  // 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    logError('登录失败，无法继续测试');
    process.exit(1);
  }

  // 测试1：获取现有关键词
  await testGetKeywords();

  // 测试2：创建关键词
  const createdIds = await testCreateKeyword();

  // 测试3：再次获取关键词列表，验证创建结果
  await testGetKeywords();

  // 测试4：更新关键词状态
  if (createdIds.length > 0) {
    await testUpdateKeyword(createdIds[0]);
  } else if (testKeywordId) {
    await testUpdateKeyword(testKeywordId);
  }

  // 测试5：获取关键词详情
  if (createdIds.length > 0) {
    await testGetKeywordById(createdIds[0]);
  } else if (testKeywordId) {
    await testGetKeywordById(testKeywordId);
  }

  // 测试6：删除关键词
  if (createdIds.length > 0) {
    await testDeleteKeyword(createdIds[0]);
  }

  // 测试7：批量操作
  await testBatchOperations();

  // 测试8：参数验证
  await testValidation();

  // 最终状态
  logTest('最终状态');
  await testGetKeywords();

  log('='.repeat(60), 'green');
  log('✅ 关键词管理功能测试完成！', 'green');
  log('='.repeat(60), 'green');
}

// 运行测试
runTests().catch(error => {
  logError(`测试过程中发生错误: ${error.message}`);
  console.error(error);
  process.exit(1);
});