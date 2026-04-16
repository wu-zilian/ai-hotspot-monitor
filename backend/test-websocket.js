#!/usr/bin/env node

/**
 * WebSocket连接测试脚本
 * 用于验证异步扫描系统的WebSocket功能
 */

const WebSocket = require('ws');

// 配置
const WS_URL = 'ws://localhost:5001/ws?userId=test-user-123&token=test-token';
const TEST_TIMEOUT = 5000;

console.log('========================================');
console.log('  WebSocket功能测试');
console.log('========================================');
console.log('');
console.log(`连接地址: ${WS_URL}`);
console.log(`测试超时: ${TEST_TIMEOUT}ms`);
console.log('');

// 创建WebSocket连接
const ws = new WebSocket(WS_URL);

let connected = false;
let messageCount = 0;

// 连接超时
const timeout = setTimeout(() => {
  if (!connected) {
    console.log('❌ 连接超时');
    console.log('');
    console.log('请检查:');
    console.log('1. 后端是否正在运行');
    console.log('2. ws模块是否已安装');
    console.log('3. 端口5001是否被占用');
    process.exit(1);
  }
}, TEST_TIMEOUT);

// 连接打开
ws.on('open', () => {
  connected = true;
  clearTimeout(timeout);
  console.log('✅ WebSocket连接成功！');
  console.log('');

  // 发送心跳测试
  console.log('📤 发送心跳测试...');
  ws.send(JSON.stringify({ type: 'ping' }));
});

// 接收消息
ws.on('message', (data) => {
  messageCount++;
  const message = JSON.parse(data.toString());

  console.log(`📥 收到消息 #${messageCount}:`);
  console.log(`   类型: ${message.type}`);

  if (message.type === 'pong') {
    console.log('   内容: 心跳响应 ✓');
  } else if (message.type === 'connected') {
    console.log('   内容: 连接确认 ✓');
  } else {
    console.log('   数据:', JSON.stringify(message).substring(0, 100) + '...');
  }
  console.log('');
});

// 连接错误
ws.on('error', (error) => {
  console.log('❌ WebSocket错误:', error.message);
  clearTimeout(timeout);
});

// 连接关闭
ws.on('close', () => {
  console.log('🔌 WebSocket连接已关闭');
  clearTimeout(timeout);

  console.log('');
  console.log('========================================');
  console.log('  测试结果');
  console.log('========================================');
  console.log('');

  if (connected) {
    console.log('✅ WebSocket功能正常！');
    console.log('');
    console.log('后续步骤:');
    console.log('1. 在浏览器中测试前端功能');
    console.log('2. 登录系统并测试异步扫描');
    console.log('3. 观察浏览器控制台的WebSocket消息');
  } else {
    console.log('❌ WebSocket连接失败');
    console.log('');
    console.log('故障排查:');
    console.log('1. 确认后端正在运行');
    console.log('2. 检查后端启动日志是否包含:');
    console.log('   "WebSocket服务器已初始化"');
    console.log('3. 确认ws模块已安装');
  }

  process.exit(connected ? 0 : 1);
});

// 保持连接开放进行测试
setTimeout(() => {
  if (connected) {
    console.log('✅ 测试完成，主动关闭连接');
    ws.close();
  }
}, 3000);
