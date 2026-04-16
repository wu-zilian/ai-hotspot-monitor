/**
 * AI热点监控工具 - Skills使用示例
 *
 * 展示如何使用AI热点监控工具的Skills包
 */

const AIHotspotMonitorSkills = require('./index');

// 配置Skills
const config = {
  apiKey: process.env.OPENROUTER_API_KEY || 'your-api-key-here',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  emailService: {
    enabled: true,
    host: process.env.SMTP_HOST
  },
  webPushService: {
    enabled: false
  },
  slackWebhook: process.env.SLACK_WEBHOOK || null
};

// 初始化Skills
const skills = new AIHotspotMonitorSkills(config);

async function main() {
  console.log('🔥 AI热点监控工具 - Skills使用示例\n');

  // 示例1: 检查Skills健康状态
  console.log('\n=== 示例1: 健康检查 ===');
  const health = await skills.healthCheck();
  console.log('Skills健康状态:', health);
  console.log('----------------------------------');

  // 示例2: 获取Skills信息
  console.log('\n=== 示例2: 获取Skills信息 ===');
  const skillsInfo = skills.getSkillsInfo();
  console.log('可用Skills:', JSON.stringify(skillsInfo, null, 2));
  console.log('----------------------------------');

  // 示例3: 监控单个关键词
  console.log('\n=== 示例3: 监控单个关键词 ===');
  const singleResult = await skills.monitorHotspots(['AI', 'GPT', '大模型'], {
    timeRange: '24h',
    maxResults: 50
  });
  console.log('监控结果:', JSON.stringify(singleResult, null, 2));
  console.log('----------------------------------');

  // 示例4: 分析内容真实性
  console.log('\n=== 示例4: 分析内容真实性 ===');
  const contentToAnalyze = 'OpenAI即将发布GPT-5模型，性能提升显著';
  const analysisResult = await skills.analyzeContent(contentToAnalyze, 'TechCrunch');
  console.log('分析结果:', JSON.stringify(analysisResult, null, 2));
  console.log('----------------------------------');

  // 示例5: 发送通知
  console.log('\n=== 示例5: 发送通知 ===');
  const notification = {
    title: '新热点发现：AI技术突破',
    content: analysisResult.data?.summary || '检测到重要的AI技术进展',
    source: 'AI Hotspot Monitor',
    type: analysisResult.data?.isAuthentic ? 'success' : 'warning',
    url: 'https://example.com/hotspot/123',
    recipients: ['user@example.com'],
    channels: ['email']
  };

  const sendResult = await skills.sendNotification(notification);
  console.log('发送结果:', JSON.stringify(sendResult, null, 2));
  console.log('----------------------------------');

  // 示例6: 批量监控
  console.log('\n=== 示例6: 批量监控 ===');
  const keywordGroups = [
    {
      name: 'AI技术',
      keywords: ['AI', '人工智能', '机器学习', '深度学习']
    },
    {
      name: '编程工具',
      keywords: ['编程', '代码', 'IDE', '开发工具']
    },
    {
      name: '大模型',
      keywords: ['GPT', 'LLM', 'transformer', '模型发布']
    }
  ];

  const batchResult = await skills.batchMonitor(keywordGroups);
  console.log('批量监控结果:', JSON.stringify(batchResult, null, 2));
  console.log('----------------------------------');

  // 示例7: 智能扫描
  console.log('\n=== 示例7: 智能扫描 ===');
  const smartScanResult = await skills.smartScan({
    keywords: ['OpenAI', 'Google AI', 'Anthropic'],
    useAI: true,
    confidenceThreshold: 70
  });
  console.log('智能扫描结果:', JSON.stringify(smartScanResult, null, 2));
  console.log('----------------------------------');

  // 示例8: 快速分析
  console.log('\n=== 示例8: 快速分析 ===');
  const quickContent = 'Meta发布新的AI框架';
  const quickResult = await skills.contentAnalyzer.quickAnalyze(quickContent);
  console.log('快速分析结果:', JSON.stringify(quickResult, null, 2));
  console.log('----------------------------------');

  // 示例9: 批量发送通知
  console.log('\n=== 示例9: 批量发送通知 ===');
  const notifications = [
    {
      title: '热点1: AI新模型发布',
      content: '检测到重要的AI模型发布',
      type: 'success'
    },
    {
      title: '热点2: 编程工具更新',
      content: '新的开发工具版本发布',
      type: 'info'
    },
    {
      title: '热点3: 技术突破',
      content: 'AI领域取得重要进展',
      type: 'warning'
    }
  ];

  const batchSendResult = await skills.notificationSender.batchSend(notifications);
  console.log('批量发送结果:', JSON.stringify(batchSendResult, null, 2));
  console.log('----------------------------------');

  // 示例10: 获取发送历史
  console.log('\n=== 示例10: 获取发送历史 ===');
  const history = await skills.notificationSender.getHistory({ limit: 20 });
  console.log('发送历史:', JSON.stringify(history, null, 2));
  console.log('----------------------------------');

  // 示例11: 发送紧急通知
  console.log('\n=== 示例11: 发送紧急通知 ===');
  const emergencyResult = await skills.notificationSender.sendEmergency({
    title: '🚨 紧急：重大技术突破',
    content: 'AI领域出现重大突破，请立即查看',
    type: 'error',
    url: 'https://example.com/emergency'
  });
  console.log('紧急通知结果:', JSON.stringify(emergencyResult, null, 2));
  console.log('----------------------------------');
  console.log('\n✅ 所有示例执行完成！');
}

// 执行示例
if (require.main === module) {
  main().catch(error => {
    console.error('示例执行失败:', error);
    process.exit(1);
  });
}

// 导出主要功能，供其他模块调用
module.exports = {
  AIHotspotMonitorSkills,
  runExample: main
};