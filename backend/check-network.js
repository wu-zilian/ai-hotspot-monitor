#!/usr/bin/env node

/**
 * 网络连接诊断脚本
 * 检查前后端服务状态和API连接
 */

const axios = require('axios');

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

async function checkConnection() {
  console.log('\n' + '='.repeat(60));
  log('  🔍 网络连接诊断', 'cyan');
  console.log('='.repeat(60) + '\n');

  const results = {
    backend: false,
    frontend: false,
    api: false,
    websocket: false,
    auth: false
  };

  // 1. 检查后端健康状态
  log('1️⃣  检查后端服务...', 'yellow');
  try {
    const response = await axios.get('http://localhost:5001/health', {
      timeout: 3000
    });
    if (response.data.status === 'ok') {
      log('   ✅ 后端服务正常', 'green');
      log(`   WebSocket状态: ${response.data.websocket}`, 'blue');
      results.backend = true;
    }
  } catch (error) {
    log(`   ❌ 后端服务无法访问: ${error.message}`, 'red');
    log('   💡 请确保后端正在运行: cd backend && node server.js', 'yellow');
  }

  // 2. 检查前端服务
  log('\n2️⃣  检查前端服务...', 'yellow');
  try {
    const response = await axios.get('http://localhost:3000', {
      timeout: 3000
    });
    if (response.data.includes('DOCTYPE html')) {
      log('   ✅ 前端服务正常', 'green');
      log('   访问地址: http://localhost:3000', 'blue');
      results.frontend = true;
    }
  } catch (error) {
    log(`   ❌ 前端服务无法访问: ${error.message}`, 'red');
    log('   💡 请确保前端正在运行: cd frontend && npm start', 'yellow');
  }

  // 3. 检查API连接
  log('\n3️⃣  检查API连接...', 'yellow');
  try {
    const response = await axios.get('http://localhost:5001/api', {
      timeout: 3000
    });
    log('   ✅ API端点可访问', 'green');
    results.api = true;
  } catch (error) {
    log(`   ❌ API端点无法访问: ${error.message}`, 'red');
  }

  // 4. 测试登录API
  log('\n4️⃣  测试登录API...', 'yellow');
  try {
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    }, { timeout: 5000 });

    if (response.data.token) {
      log('   ✅ 登录API正常', 'green');
      log(`   Token长度: ${response.data.token.length} 字符`, 'blue');
      results.auth = true;
    }
  } catch (error) {
    log(`   ❌ 登录API失败: ${error.response?.data?.message || error.message}`, 'red');
  }

  // 5. 测试关键词API
  log('\n5️⃣  测试关键词API...', 'yellow');
  try {
    const response = await axios.get('http://localhost:5001/api/keywords', {
      timeout: 3000,
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    log('   ✅ 关键词API可访问', 'green');
  } catch (error) {
    // 401是预期的（token无效）
    if (error.response?.status === 401) {
      log('   ✅ 关键词API正常（需要认证）', 'green');
    } else {
      log(`   ⚠️  关键词API响应: ${error.message}`, 'yellow');
    }
  }

  // 输出结果汇总
  console.log('\n' + '='.repeat(60));
  log('  📊 诊断结果汇总', 'cyan');
  console.log('='.repeat(60) + '\n');

  const allPassed = Object.values(results).every(r => r);

  Object.entries(results).forEach(([service, passed]) => {
    const status = passed ? '✅ 正常' : '❌ 异常';
    const color = passed ? 'green' : 'red';
    log(`   ${service.padEnd(12)} ${status}`, color);
  });

  console.log('\n' + '='.repeat(60));

  if (allPassed) {
    log('\n🎉 所有服务运行正常！', 'green');
    log('   可以访问: http://localhost:3000', 'blue');
    log('   登录账号: admin@example.com / admin123', 'blue');
  } else {
    log('\n⚠️  部分服务异常，请检查上述失败项', 'yellow');
  }

  console.log('\n' + '='.repeat(60));

  // 故障排查建议
  if (!results.backend) {
    log('\n🔧 后端服务启动方法:', 'yellow');
    log('   cd backend', 'blue');
    log('   node server.js', 'blue');
  }

  if (!results.frontend) {
    log('\n🔧 前端服务启动方法:', 'yellow');
    log('   cd frontend', 'blue');
    log('   npm start', 'blue');
  }

  if (results.backend && results.frontend && !results.auth) {
    log('\n🔧 前端无法连接后端可能的原因:', 'yellow');
    log('   1. 浏览器缓存问题 - 尝试强制刷新 (Ctrl+Shift+R)', 'blue');
    log('   2. CORS配置问题 - 检查后端CORS设置', 'blue');
    log('   3. 代理配置问题 - 检查前端proxy设置', 'blue');
  }

  console.log('');
}

// 运行诊断
checkConnection().catch(error => {
  log(`\n❌ 诊断脚本执行失败: ${error.message}`, 'red');
  process.exit(1);
});
