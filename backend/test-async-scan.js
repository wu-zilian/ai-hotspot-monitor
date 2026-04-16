const axios = require('axios');

async function testAsyncScan() {
  console.log('========================================');
  console.log('  异步扫描功能测试');
  console.log('========================================');
  console.log('');

  try {
    // 先登录获取token
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const token = loginResponse.data.token;

    console.log('🚀 启动异步扫描...');
    console.log('');

    // 启动异步扫描
    const scanResponse = await axios.post('http://localhost:5001/api/tasks/scan', {
      sources: ['hackernews'],
      limit: 5,
      enableAI: false
    }, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    console.log('✅ 扫描任务已启动！');
    console.log('');
    console.log('📋 任务信息:');
    console.log('   Task ID:', scanResponse.data.taskId);
    console.log('   状态:', scanResponse.data.status);
    console.log('   WebSocket URL:', scanResponse.data.websocketUrl);
    console.log('');

    // 等待一下，然后检查任务状态
    console.log('⏳ 等待3秒后检查任务状态...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const taskId = scanResponse.data.taskId;
    const statusResponse = await axios.get(`http://localhost:5001/api/tasks/scan/${taskId}/status`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    console.log('');
    console.log('📊 任务状态:');
    console.log('   状态:', statusResponse.data.data.status);

    if (statusResponse.data.data.progress) {
      console.log('   进度:', JSON.stringify(statusResponse.data.data.progress));
    }

    console.log('');
    console.log('========================================');
    console.log('  ✅ 异步扫描API正常！');
    console.log('========================================');

  } catch (error) {
    console.log('');
    console.log('❌ 扫描测试失败:', error.response?.data || error.message);
  }

  process.exit(0);
}

testAsyncScan();
