// 测试AI分析功能
require('dotenv').config();
const { analyzeWithAI } = require('./src/services/ai.service');

console.log('环境变量检查:');
console.log('- GLM_API_KEY 存在:', !!process.env.GLM_API_KEY);
console.log('- GLM_API_KEY 长度:', process.env.GLM_API_KEY?.length);
console.log('- GLM_MODEL:', process.env.GLM_MODEL);
console.log('- AI_SERVICE_PROVIDER:', process.env.AI_SERVICE_PROVIDER);
console.log('---');

const testContent = 'AI技术正在快速发展，GPT-4、Claude等大模型已经问世。这是一个测试内容。';

console.log('开始测试AI分析...');
console.log('测试内容:', testContent.substring(0, 50) + '...');
console.log('---');

analyzeWithAI(testContent, 'test-source')
  .then(result => {
    console.log('✅ AI分析成功!');
    console.log('分析结果:');
    console.log('- isAuthentic:', result.isAuthentic);
    console.log('- confidence:', result.confidence);
    console.log('- verification.status:', result.verification?.status);
    console.log('- analysis.summary:', result.analysis?.summary);
    console.log('- reasons:', result.reasons);
    console.log('---');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ AI分析失败!');
    console.error('错误信息:', err.message);
    console.error('错误栈:', err.stack);
    process.exit(1);
  });
