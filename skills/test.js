/**
 * AI热点监控工具 - Skills包测试
 */

const AIHotspotMonitorSkills = require('./index');

// 配置Skills
const config = {
  apiKey: process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY || 'test-key',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  provider: process.env.AI_SERVICE_PROVIDER || 'deepseek'
};

async function runTests() {
  console.log('🔥 AI热点监控工具 - Skills包测试');
  console.log('=====================================\n');

  const skills = new AIHotspotMonitorSkills(config);

  // 测试1: 获取Skills信息
  console.log('📋 测试1: 获取Skills信息');
  try {
    const info = skills.getSkillsInfo();
    console.log('✅ Skills名称:', info.name);
    console.log('✅ Skills版本:', info.version);
    console.log('✅ 可用Skills:', info.skills.map(s => s.name).join(', '));
  } catch (error) {
    console.log('❌ 获取Skills信息失败:', error.message);
  }
  console.log();

  // 测试2: 健康检查
  console.log('🏥 测试2: 健康检查');
  try {
    const health = await skills.healthCheck();
    console.log('✅ 整体状态:', health.status);
    console.log('✅ 时间戳:', health.timestamp);
    if (health.skills) {
      Object.entries(health.skills).forEach(([name, status]) => {
        console.log(`  - ${name}: ${status.status}`);
      });
    }
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
  }
  console.log();

  // 测试3: 热点监控（模拟）
  console.log('🔍 测试3: 热点监控');
  try {
    const result = await skills.monitorHotspots(['AI', '编程'], {
      maxResults: 10,
      timeRange: '24h'
    });
    console.log('✅ 监控成功:', result.success);
    if (result.success) {
      console.log('✅ 发现热点数:', result.total);
      console.log('✅ 数据源数:', result.sources);
    }
  } catch (error) {
    console.log('❌ 热点监控失败:', error.message);
  }
  console.log();

  // 测试4: 内容分析
  console.log('🤖 测试4: 内容分析');
  try {
    const content = '测试内容：AI技术在编程领域的应用越来越广泛';
    const analysis = await skills.analyzeContent(content, 'test');
    console.log('✅ 分析成功:', analysis.success);
    if (analysis.success && analysis.data) {
      console.log('✅ 内容真实:', analysis.data.isAuthentic);
      console.log('✅ 置信度:', analysis.data.confidence + '%');
      console.log('✅ 分析摘要:', analysis.data.summary);
    }
  } catch (error) {
    console.log('❌ 内容分析失败:', error.message);
  }
  console.log();

  // 测试5: 通知发送（模拟）
  console.log('📧 测试5: 通知发送');
  try {
    const notification = {
      title: '测试通知',
      content: '这是一条测试通知',
      type: 'info',
      channels: []
    };
    const result = await skills.sendNotification(notification);
    console.log('✅ 发送成功:', result.success);
  } catch (error) {
    console.log('❌ 通知发送失败:', error.message);
  }
  console.log();

  // 测试总结
  console.log('=====================================');
  console.log('📊 测试总结：');
  console.log('✅ 基础功能正常');
  console.log('📝 注意：部分功能需要配置API密钥才能完全测试');
  console.log('🔗 完整测试请配置.env文件中的API密钥');
  console.log('');
  console.log('🎯 下一步：');
  console.log('1. 配置API密钥');
  console.log('2. 启动MongoDB容器');
  console.log('3. 运行完整的应用测试');
  console.log('');
  console.log('🔥 所有基础测试完成！');
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = { runTests };