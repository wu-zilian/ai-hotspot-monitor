/**
 * AI热点监控工具 - Agent Skills包
 *
 * 提供可复用的热点监控功能，可被其他AI系统调用
 *
 * @module ai-hotspot-monitor-skills
 * @version 1.0.0
 */

const HotspotMonitor = require('./skills/hotspot-monitor');
const ContentAnalyzer = require('./skills/content-analyzer');
const NotificationSender = require('./skills/notification-sender');

/**
 * Skills包主入口
 * 导出所有可用的Skills
 */
class AIHotspotMonitorSkills {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENROUTER_API_KEY,
      apiUrl: config.apiUrl || process.env.API_URL || 'http://localhost:5000',
      ...config
    };

    // 初始化各个Skills
    this.hotspotMonitor = new HotspotMonitor(this.config);
    this.contentAnalyzer = new ContentAnalyzer(this.config);
    this.notificationSender = new NotificationSender(this.config);
  }

  /**
   * 热点监控Skill
   * 监控指定关键词相关的热点内容
   */
  async monitorHotspots(keywords, options = {}) {
    return await this.hotspotMonitor.monitor(keywords, options);
  }

  /**
   * 内容分析Skill
   * 使用AI分析内容的真实性和可信度
   */
  async analyzeContent(content, source = '') {
    return await this.contentAnalyzer.analyze(content, source);
  }

  /**
   * 通知发送Skill
   * 发送各类通知（邮件、Web推送等）
   */
  async sendNotification(notification) {
    return await this.notificationSender.send(notification);
  }

  /**
   * 批量监控
   * 监控多个关键词组合
   */
  async batchMonitor(keywordGroups, options = {}) {
    const results = [];

    for (const group of keywordGroups) {
      try {
        const result = await this.monitorHotspots(group.keywords, options);
        results.push({
          groupName: group.name,
          success: true,
          data: result
        });
      } catch (error) {
        results.push({
          groupName: group.name,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 智能扫描
   * 基于AI分析结果智能扫描热点
   */
  async smartScan(options = {}) {
    const { useAI = true, confidenceThreshold = 70 } = options;

    // 先获取基础热点
    const hotspots = await this.hotspotMonitor.scan(options);

    if (useAI) {
      // 使用AI分析每个热点的真实性
      for (const hotspot of hotspots) {
        try {
          const analysis = await this.analyzeContent(hotspot.content, hotspot.source);

          // 添加AI分析结果
          hotspot.aiAnalysis = analysis;

          // 如果置信度低于阈值，标记为可疑
          if (analysis.confidence < confidenceThreshold) {
            hotspot.status = 'suspicious';
          } else {
            hotspot.status = analysis.isAuthentic ? 'verified' : 'unverified';
          }
        } catch (error) {
          hotspot.status = 'analysis_failed';
          hotspot.aiAnalysis = null;
        }
      }
    }

    return hotspots;
  }

  /**
   * 健康检查
   * 检查Skills包的运行状态
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      skills: {}
    };

    // 检查各个Skill的健康状态
    try {
      health.skills.hotspotMonitor = await this.hotspotMonitor.healthCheck();
      health.skills.contentAnalyzer = await this.contentAnalyzer.healthCheck();
      health.skills.notificationSender = await this.notificationSender.healthCheck();

      // 如果有Skill不健康，整体状态为degraded
      const degradedSkills = Object.values(health.skills).filter(s => s.status !== 'healthy');
      if (degradedSkills.length > 0) {
        health.status = 'degraded';
        health.issues = degradedSkills.map(s => s.name);
      }
    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }

    return health;
  }

  /**
   * 获取Skill信息
   * 返回Skills包的详细信息
   */
  getSkillsInfo() {
    return {
      name: 'AI Hotspot Monitor Skills',
      version: '1.0.0',
      description: '提供智能热点监控和内容分析功能',
      skills: [
        {
          name: 'hotspot-monitor',
          version: '1.0.0',
          description: '监控和发现科技热点内容',
          capabilities: ['关键词监控', '内容采集', '热点发现']
        },
        {
          name: 'content-analyzer',
          version: '1.0.0',
          description: '使用AI分析内容真实性',
          capabilities: ['真实性验证', '置信度评分', '虚假内容识别']
        },
        {
          name: 'notification-sender',
          version: '1.0.0',
          description: '发送各类通知',
          capabilities: ['邮件通知', 'Web推送', '批量发送']
        }
      ],
      configuration: this.config
    };
  }
}

module.exports = AIHotspotMonitorSkills;