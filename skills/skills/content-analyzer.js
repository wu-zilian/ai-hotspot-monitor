/**
 * 内容分析Skill
 *
 * 使用AI分析内容的真实性和可信度
 */

const axios = require('axios');

class ContentAnalyzer {
  constructor(config) {
    this.config = config;
    this.name = 'content-analyzer';
    this.version = '1.0.0';
  }

  /**
   * 分析内容
   * @param {string} content - 要分析的内容
   * @param {string} source - 内容来源
   * @returns {Promise<Object>} 分析结果
   */
  async analyze(content, source = '') {
    console.log(`[ContentAnalyzer] 开始分析内容: ${content.substring(0, 50)}...`);

    try {
      // 如果配置了API URL，通过后端API分析
      if (this.config.apiUrl) {
        return await this.analyzeViaAPI(content, source);
      }

      // 直接使用OpenRouter API
      return await this.analyzeViaOpenRouter(content, source);
    } catch (error) {
      console.error('[ContentAnalyzer] 分析失败:', error);
      return this.getFallbackResult(error);
    }
  }

  /**
   * 通过API分析
   */
  async analyzeViaAPI(content, source) {
    const response = await axios({
      method: 'post',
      url: `${this.config.apiUrl}/api/content/analyze`,
      data: { content, source },
      headers: {
        'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : undefined
      }
    });

    return response.data;
  }

  /**
   * 通过OpenRouter API分析
   */
  async analyzeViaOpenRouter(content, source) {
    const prompt = this.buildAnalysisPrompt(content, source);

    const response = await axios({
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      data: {
        model: 'openai/gpt-4o',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      },
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': this.config.apiUrl || 'http://localhost:3000',
        'X-Title': 'AI Hotspot Monitor Skills',
        'Content-Type': 'application/json'
      }
    });

    return this.parseAIResponse(response.data);
  }

  /**
   * 构建分析提示词
   */
  buildAnalysisPrompt(content, source) {
    return `
请仔细分析以下内容的真实性，特别关注AI编程相关的热点信息：

内容来源：${source}
内容文本：
${content}

请按照以下步骤分析：
1. 内容真实性判断：基于事实核查、权威性评估
2. 虚假信息识别：识别可能的虚假、夸大、误导性内容
3. 技术准确性：验证技术陈述的准确性
4. 来源可信度：评估信息来源的可靠性

请以JSON格式返回分析结果，包含以下字段：
- isAuthentic: boolean (是否真实可信)
- confidence: number (可信度评分，0-100)
- reasons: string[] (分析理由，至少3点)
- summary: string (简要总结，不超过100字)
- category: string (内容分类：技术新闻/产品发布/行业动态/其他)
- tags: string[] (相关标签，3-5个)

注意：对于无法确定真实性的内容，置信度应低于60。
    `;
  }

  /**
   * 解析AI响应
   */
  parseAIResponse(response) {
    try {
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('无效的AI响应');
      }

      const analysis = JSON.parse(content);
      return {
        success: true,
        data: analysis,
        raw: response
      };
    } catch (error) {
      console.error('[ContentAnalyzer] 解析AI响应失败:', error);
      return {
        success: false,
        error: 'AI响应解析失败',
        data: null
      };
    }
  }

  /**
   * 批量分析
   */
  async batchAnalyze(contents, options = {}) {
    const { concurrent = 3 } = options;

    console.log(`[ContentAnalyzer] 批量分析 ${contents.length} 条内容`);

    const results = [];
    const batches = [];

    // 分批处理
    for (let i = 0; i < contents.length; i += concurrent) {
      const batch = contents.slice(i, i + concurrent);
      batches.push(batch);
    }

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(item => this.analyze(item.content, item.source))
      );

      results.push(...batchResults);

      // 避免请求过于频繁
      if (batch !== batches[batches.length - 1]) {
        await this.sleep(1000);
      }
    }

    console.log(`[ContentAnalyzer] 批量分析完成，成功 ${results.filter(r => r.success).length}/${results.length}`);

    return results;
  }

  /**
   * 快速分析
   * 使用较简单的模型快速分析
   */
  async quickAnalyze(content, source = '') {
    const prompt = this.buildQuickAnalysisPrompt(content, source);

    const response = await axios({
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      data: {
        model: 'openai/gpt-4o-mini', // 使用更快的模型
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      },
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': this.config.apiUrl || 'http://localhost:3000',
        'X-Title': 'AI Hotspot Monitor Skills'
        'Content-Type': 'application/json'
      }
    });

    return this.parseAIResponse(response.data);
  }

  /**
   * 构建快速分析提示词
   */
  buildQuickAnalysisPrompt(content, source) {
    return `
快速分析以下内容的基本真实性：

来源：${source}
内容：${content.substring(0, 300)}

请简短回答：
1. 内容是否基本真实？（是/否/不确定）
2. 简要理由（不超过50字）

返回JSON格式：{ "isAuthentic": boolean, "reason": string }
    `;
  }

  /**
   * 获取降级结果
   */
  getFallbackResult(error) {
    return {
      success: false,
      error: error.message,
      data: {
        isAuthentic: false,
        confidence: 0,
        reasons: [`分析失败: ${error.message}`],
        summary: '无法完成内容分析',
        category: 'unknown',
        tags: ['error']
      }
    };
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      // 简单测试API连接
      const testResult = await this.quickAnalyze('测试内容', 'test');
      return {
        status: 'healthy',
        name: this.name,
        version: this.version,
        capabilities: ['真实性验证', '置信度评分', '虚假内容识别'],
        timestamp: new Date().toISOString(),
        testResult
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        name: this.name,
        version: this.version,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ContentAnalyzer;