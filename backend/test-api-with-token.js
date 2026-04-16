const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = 'your-secret-key-change-this-in-production';
const TEST_USER_ID = '69d764c9f8106f521223043e';

// 生成token
const token = jwt.sign({ userId: TEST_USER_ID }, JWT_SECRET, { expiresIn: '24h' });

console.log('=== 测试 /api/notifications/read-all API ===\n');
console.log('生成的token:', token.substring(0, 50) + '...\n');

// 测试API
axios.put('http://localhost:5001/api/notifications/read-all', {}, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ API调用成功!');
  console.log('状态码:', response.status);
  console.log('响应数据:', response.data);
  process.exit(0);
})
.catch(error => {
  console.error('❌ API调用失败!');
  if (error.response) {
    console.error('状态码:', error.response.status);
    console.error('响应数据:', error.response.data);
    console.error('请求URL:', error.config.url);
  } else {
    console.error('错误:', error.message);
  }
  process.exit(1);
});
