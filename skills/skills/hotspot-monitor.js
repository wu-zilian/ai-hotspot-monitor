/**
 * 热点监控Skill
 *
 * 负责监控和发现科技热点内容
 */

const axios = require('axios');

class HotspotMonitor {
  constructor(config) {
    this.config = config;
    this.name = 'hotspot-monitor';
    this.version = '1.0.0';
  }

  /**
   * 监控热点
   * @param {Array} keywords - 要监控的关键词数组
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} 监控结果
   */
  async monitor(keywords, options = {}) {
    const {
      sources = this.getDefaultSources(),
      maxResults = 100,
      timeRange = '24h',
      includeAI = true
    } = options;

    console.log(`[HotspotMonitor] 开始监控关键词: ${keywords.join(', ')}`);

    try {
      const hotspots = [];

      // 并发监控多个数据源
      const monitorPromises = sources.map(source =>
        this.monitorSource(source, keywords, maxResults)
      );

      const results = await Promise.all(monitorPromises);

      // 合并结果
      results.forEach(result => {
        if (result.success) {
          hotspots.push(...result.data);
        }
      });

      // 去重
      const uniqueHotspots = this.deduplicateHotspots(hotspots);

      console.log(`[HotspotMonitor] 发现 ${uniqueHotspots.length} 个热点`);

      return {
        success: true,
        data: uniqueHotspots,
        total: uniqueHotspots.length,
        sources: sources.length,
        keywords: keywords.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[HotspotMonitor] 监控失败:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 监控单个数据源
   */
  async monitorSource(source, keywords, maxResults) {
    try {
      const response = await this.fetchFromSource(source, keywords, maxResults);

      return {
        success: true,
        source: source.name,
        data: response.data || []
      };
    } catch (error) {
      console.error(`[HotspotMonitor] 监控 ${source.name} 失败:`, error);
      return {
        success: false,
        source: source.name,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * 从数据源获取内容
   */
  async fetchFromSource(source, keywords, maxResults) {
    const axiosConfig = {
      method: 'get',
      url: this.buildSourceUrl(source, keywords, maxResults),
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    // 如果配置了API URL，通过后端API获取
    if (this.config.apiUrl) {
      return await axios({
        ...axiosConfig,
        url: `${this.config.apiUrl}/api/content/scan`,
        params: {
          sources: [source.url],
          keywords: keywords,
          maxResults
        },
        headers: {
          ...axiosConfig.headers,
          'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : undefined
        }
      });
    }

    // 直接爬取数据源
    return await axios(axiosConfig);
  }

  /**
   * 构建数据源URL
   */
  buildSourceUrl(source, keywords, maxResults) {
    if (source.searchUrl) {
      const url = new URL(source.searchUrl);
      keywords.forEach(keyword => url.searchParams.append('q', keyword));
      url.searchParams.append('max', maxResults);
      return url.toString();
    }
    return source.url;
  }

  /**
   * 获取默认数据源
   */
  getDefaultSources() {
    return [
      {
        name: 'TechCrunch',
        url: 'https://techcrunch.com',
        searchUrl: 'https://techcrunch.com/search',
        type: 'news'
      },
      {
        name: 'Hacker News',
        url: 'https://news.ycombinator.com',
        searchUrl: 'https://hn.algolia.com/api/v1/search',
        type: 'community'
      },
      {
        name: 'Reddit /r/programming',
        url: 'https://www.reddit.com/r/programming/hot',
        type: 'social'
      },
      {
        name: 'Twitter Trends',
        url: 'https://twitter.com/i/trends',
        type: 'social'
      }
    ];
  }

  /**
   * 去重热点
   */
  deduplicateHotspots(hotspots) {
    const seen = new Set();
    return hotspots.filter(hotspot => {
      const key = `${hotspot.title}-${hotspot.source}-${hotspot.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 扫描功能
   */
  async scan(options = {}) {
    const {
      keywords = [],
      sources = null,
      timeRange = '24h'
    } = options;

    return await this.monitor(keywords, {
      sources: sources,
      timeRange,
      ...options
    });
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    return {
      status: 'healthy',
      name: this.name,
      version: this.version,
      capabilities: ['关键词监控', '内容采集', '热点发现'],
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = HotspotMonitor;