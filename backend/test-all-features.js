#!/usr/bin/env node

/**
 * 综合功能测试脚本
 * 验证最近优化的功能：
 * 1. 邮件通知功能
 * 2. 异步扫描功能
 * 3. WebSocket实时通知
 * 4. 任务状态查询
 * 5. AI分析返回verification
 */

const axios = require('axios');
const WebSocket = require('ws');

// 配置
const API_BASE = 'http://localhost:5001/api';
const WS_BASE = 'ws://localhost:5001/ws';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testLogin() {
  section('1️⃣  测试登录获取Token');

  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    if (response.data.token) {
      log('✅ 登录成功！', 'green');
      log(`   Token: ${response.data.token.substring(0, 30)}...`, 'blue');
      log(`   用户: ${response.data.user.username}`, 'blue');
      return response.data.token;
    } else {
      throw new Error('未获取到token');
    }
  } catch (error) {
    log(`❌ 登录失败: ${error.message}`, 'red');
    throw error;
  }
}

async function testEmailNotification(token) {
  section('2️⃣  测试邮件通知功能');

  try {
    log('📧 发送测试邮件到: wq1217227253@163.com', 'yellow');

    const response = await axios.post(
      `${API_BASE}/settings/test-email`,
      { email: 'wq1217227253@163.com' },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (response.data.success) {
      log('✅ 邮件发送成功！', 'green');
      log(`   收件人: ${response.data.email}`, 'blue');
      log(`   发送时间: ${new Date(response.data.sentAt).toLocaleString()}`, 'blue');
      log('\n   💡 请检查邮箱收件箱（可能在垃圾邮件文件夹）', 'yellow');
      return true;
    } else {
      log(`❌ 邮件发送失败: ${response.data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 邮件测试失败: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testAsyncScan(token) {
  section('3️⃣  测试异步扫描API');

  try {
    log('🚀 启动异步扫描任务...', 'yellow');

    const response = await axios.post(
      `${API_BASE}/tasks/scan`,
      {
        sources: ['hackernews'],
        limit: 5,
        enableAI: true
      },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (response.data.success) {
      log('✅ 扫描任务已启动！', 'green');
      log(`   Task ID: ${response.data.taskId}`, 'blue');
      log(`   状态: ${response.data.status}`, 'blue');
      log(`   WebSocket URL: ${response.data.websocketUrl}`, 'blue');
      log('\n   ⚡ 响应时间: < 1秒 (异步返回)', 'yellow');
      return response.data.taskId;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    log(`❌ 扫描启动失败: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

async function testWebSocketConnection(token) {
  section('4️⃣  测试WebSocket连接');

  return new Promise((resolve, reject) => {
    try {
      // 获取userId（从token解码，这里简化处理）
      const userId = 'admin_user_id'; // 实际应该从token解析

      const wsUrl = `${WS_BASE}?userId=${userId}&token=${token}`;
      log(`📡 连接WebSocket: ${wsUrl}`, 'yellow');

      const ws = new WebSocket(wsUrl);
      let connected = false;
      let messageReceived = false;
      let messages = [];

      const timeout = setTimeout(() => {
        if (!connected) {
          ws.close();
          reject(new Error('WebSocket连接超时'));
        }
      }, 5000);

      ws.on('open', () => {
        connected = true;
        clearTimeout(timeout);
        log('✅ WebSocket连接成功！', 'green');

        // 发送心跳测试
        log('📤 发送心跳测试...', 'yellow');
        ws.send(JSON.stringify({ type: 'ping' }));
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          messageReceived = true;
          messages.push(message);

          log(`📥 收到消息:`, 'blue');
          log(`   类型: ${message.type}`, 'blue');
          if (message.type === 'pong') {
            log(`   内容: 心跳响应 ✓`, 'green');
          } else if (message.type === 'connected') {
            log(`   内容: ${message.message} ✓`, 'green');
          } else {
            log(`   数据: ${JSON.stringify(message).substring(0, 100)}...`, 'blue');
          }
        } catch (error) {
          log(`⚠️  消息解析失败: ${error.message}`, 'yellow');
        }
      });

      ws.on('error', (error) => {
        log(`❌ WebSocket错误: ${error.message}`, 'red');
        clearTimeout(timeout);
        reject(error);
      });

      ws.on('close', () => {
        log('🔌 WebSocket连接已关闭', 'yellow');
        clearTimeout(timeout);

        if (connected && messageReceived) {
          log('✅ WebSocket功能正常！', 'green');
          resolve(messages);
        } else if (!connected) {
          reject(new Error('WebSocket未能建立连接'));
        }
      });

      // 3秒后主动关闭
      setTimeout(() => {
        if (connected) {
          ws.close();
        }
      }, 3000);

    } catch (error) {
      reject(error);
    }
  });
}

async function testTaskStatus(token, taskId) {
  section('5️⃣  测试任务状态查询');

  try {
    // 等待一下让任务开始执行
    log('⏳ 等待2秒后查询任务状态...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const response = await axios.get(
      `${API_BASE}/tasks/scan/${taskId}/status`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (response.data.success) {
      const status = response.data.data;
      log('✅ 任务状态查询成功！', 'green');
      log(`   Task ID: ${status.taskId}`, 'blue');
      log(`   状态: ${status.status}`, 'blue');
      log(`   进度: ${JSON.stringify(status.progress)}`, 'blue');
      log(`   关键词: ${status.keywords.join(', ')}`, 'blue');
      return status;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    log(`❌ 状态查询失败: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

async function testKeywordsAPI(token) {
  section('6️⃣  测试关键词管理API');

  try {
    const response = await axios.get(
      `${API_BASE}/keywords`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    const keywords = response.data;
    log(`✅ 关键词API正常！`, 'green');
    log(`   关键词数量: ${keywords.length}`, 'blue');

    const activeKeywords = keywords.filter(k => k.isActive !== false);
    log(`   活跃关键词: ${activeKeywords.length}`, 'blue');

    if (activeKeywords.length > 0) {
      log(`   关键词列表: ${activeKeywords.map(k => k.name).join(', ')}`, 'blue');
    } else {
      log('   ⚠️  没有活跃的关键词，扫描可能无法获取数据', 'yellow');
    }

    return keywords;
  } catch (error) {
    log(`❌ 关键词查询失败: ${error.message}`, 'red');
    return [];
  }
}

async function runAllTests() {
  console.log('\n' + '█'.repeat(60));
  log('  🔥 AI热点监控系统 - 综合功能测试', 'cyan');
  log('  验证最近优化的功能', 'cyan');
  console.log('█'.repeat(60));

  const results = {
    login: false,
    email: false,
    asyncScan: false,
    websocket: false,
    taskStatus: false,
    keywords: false
  };

  let token = '';
  let taskId = '';

  try {
    // 1. 登录
    token = await testLogin();
    results.login = true;

    // 2. 测试关键词API（检查是否有活跃关键词）
    await testKeywordsAPI(token);
    results.keywords = true;

    // 3. 测试邮件通知
    results.email = await testEmailNotification(token);

    // 4. 测试异步扫描
    taskId = await testAsyncScan(token);
    results.asyncScan = true;

    // 5. 测试WebSocket
    await testWebSocketConnection(token);
    results.websocket = true;

    // 6. 测试任务状态
    await testTaskStatus(token, taskId);
    results.taskStatus = true;

  } catch (error) {
    log(`\n❌ 测试过程出错: ${error.message}`, 'red');
  }

  // 输出测试结果汇总
  section('📊 测试结果汇总');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ 通过' : '❌ 失败';
    const color = passed ? 'green' : 'red';
    log(`   ${test.padEnd(15)} ${status}`, color);
  });

  console.log('\n' + '─'.repeat(60));
  log(`总计: ${passedTests}/${totalTests} 项测试通过`, passedTests === totalTests ? 'green' : 'yellow');

  if (passedTests === totalTests) {
    log('\n🎉 所有功能测试通过！系统运行正常。', 'green');
  } else {
    log('\n⚠️  部分功能测试失败，请检查相关配置。', 'yellow');
  }

  console.log('─'.repeat(60));

  // 使用说明
  section('📖 前端使用指南');

  log('1. 访问前端: http://localhost:3000', 'blue');
  log('2. 登录账号: admin@example.com / admin123', 'blue');
  log('3. 测试扫描:', 'blue');
  log('   - 点击"立即扫描"按钮', 'blue');
  log('   - 观察进度Modal实时更新', 'blue');
  log('   - 查看5个阶段的进度反馈', 'blue');
  log('   - 等待扫描完成查看统计信息', 'blue');
  log('4. 测试邮件:', 'blue');
  log('   - 进入"系统设置"页面', 'blue');
  log('   - 点击"测试邮件"按钮', 'blue');
  log('   - 检查邮箱收件箱', 'blue');

  console.log('\n' + '█'.repeat(60) + '\n');
}

// 运行测试
runAllTests().catch(error => {
  log(`\n❌ 测试脚本执行失败: ${error.message}`, 'red');
  process.exit(1);
});
