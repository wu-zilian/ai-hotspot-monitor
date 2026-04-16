const axios = require('axios');
const cheerio = require('cheerio');

// 导入各个爬虫服务
const hackernewsCrawler = require('./hackernews.crawler');
const bingCrawler = require('./bing.crawler');
const sogouCrawler = require('./sogou.crawler');
const weiboCrawler = require('./weibo.crawler');
const googleCrawler = require('./google.crawler');
const ddgCrawler = require('./ddg.crawler');
const twitterCrawler = require('./twitter.crawler');
const bilibiliCrawler = require('./bilibili.crawler');

/**
 * 统一爬虫服务
 * 支持多个信息源的调度和管理
 */

// 支持的信息源配置
const CRAWLER_SOURCES = {
  hackernews: {
    name: 'HackerNews',
    enabled: true,
    priority: 1,
    requiresApiKey: false
  },
  google: {
    name: 'Google搜索',
    enabled: true,
    priority: 2,
    requiresApiKey: false
  },
  bing: {
    name: 'Bing搜索',
    enabled: true,
    priority: 3,
    requiresApiKey: false
  },
  ddg: {
    name: 'DuckDuckGo',
    enabled: true,
    priority: 4,
    requiresApiKey: false
  },
  sogou: {
    name: '搜狗搜索',
    enabled: true,
    priority: 5,
    requiresApiKey: false
  },
  sogou_wechat: {
    name: '搜狗微信',
    enabled: true,
    priority: 6,
    requiresApiKey: false
  },
  weibo: {
    name: '微博',
    enabled: true,
    priority: 7,
    requiresApiKey: false,
    requiresCookie: true
  },
  twitter: {
    name: 'Twitter',
    enabled: true,
    priority: 8,
    requiresApiKey: true
  },
  bilibili: {
    name: 'B站',
    enabled: true,
    priority: 9,
    requiresApiKey: false
  }
};

/**
 * 主函数：根据关键词从多个信息源爬取热点
 * @param {Array<string>} keywords - 关键词列表
 * @param {Object} options - 配置选项
 */
async function crawlAllSources(keywords = [], options = {}) {
  const {
    sources = ['hackernews', 'google', 'bing', 'ddg', 'sogou', 'weibo', 'twitter', 'bilibili'],
    maxResultsPerSource = 20,
    includeWechat = false,
    includeHotTrends = true
  } = options;

  console.log(`开始爬取，关键词: ${keywords.join(', ')}`);
  console.log(`信息源: ${sources.join(', ')}`);

  const allResults = [];
  const errors = [];

  // 1. HackerNews 爬虫
  if (sources.includes('hackernews') && CRAWLER_SOURCES.hackernews.enabled) {
    try {
      const hnResults = await hackernewsCrawler.crawlHackerNews(
        keywords,
        maxResultsPerSource
      );
      allResults.push(...hnResults);
      console.log(`HackerNews: 获取 ${hnResults.length} 条`);
    } catch (error) {
      console.error('HackerNews 爬取失败:', error.message);
      errors.push({ source: 'HackerNews', error: error.message });
    }
  }

  // 2. Bing 搜索爬虫
  if (sources.includes('bing') && CRAWLER_SOURCES.bing.enabled) {
    try {
      const bingResults = await bingCrawler.crawlBing(
        keywords,
        { resultsPerKeyword: Math.ceil(maxResultsPerSource / keywords.length) || 5 }
      );
      allResults.push(...bingResults);
      console.log(`Bing: 获取 ${bingResults.length} 条`);
    } catch (error) {
      console.error('Bing 爬取失败:', error.message);
      errors.push({ source: 'Bing', error: error.message });
    }
  }

  // 3. 搜狗搜索爬虫
  if (sources.includes('sogou') && CRAWLER_SOURCES.sogou.enabled) {
    try {
      const sogouResults = await sogouCrawler.crawlSogou(
        keywords,
        {
          type: 'web',
          resultsPerKeyword: Math.ceil(maxResultsPerSource / keywords.length) || 5
        }
      );
      allResults.push(...sogouResults);
      console.log(`搜狗: 获取 ${sogouResults.length} 条`);
    } catch (error) {
      console.error('搜狗爬取失败:', error.message);
      errors.push({ source: '搜狗', error: error.message });
    }
  }

  // 4. 搜狗微信爬虫（可选）
  if (includeWechat && sources.includes('sogou_wechat') && CRAWLER_SOURCES.sogou_wechat.enabled) {
    try {
      const wechatResults = await sogouCrawler.crawlSogou(
        keywords,
        {
          type: 'weixin',
          resultsPerKeyword: Math.ceil(maxResultsPerSource / keywords.length) || 5
        }
      );
      allResults.push(...wechatResults);
      console.log(`搜狗微信: 获取 ${wechatResults.length} 条`);
    } catch (error) {
      console.error('搜狗微信爬取失败:', error.message);
      errors.push({ source: '搜狗微信', error: error.message });
    }
  }

  // 5. 微博爬虫
  if (sources.includes('weibo') && CRAWLER_SOURCES.weibo.enabled) {
    try {
      const weiboResults = await weiboCrawler.crawlWeibo(
        keywords,
        {
          resultsPerKeyword: Math.ceil(maxResultsPerSource / keywords.length) || 5,
          includeHotTrends
        }
      );
      allResults.push(...weiboResults);
      console.log(`微博: 获取 ${weiboResults.length} 条`);
    } catch (error) {
      console.error('微博爬取失败:', error.message);
      errors.push({ source: '微博', error: error.message });
    }
  }

  // 6. Google 搜索爬虫
  if (sources.includes('google') && CRAWLER_SOURCES.google.enabled) {
    try {
      const googleResults = await googleCrawler.crawlGoogle(
        keywords,
        { resultsPerKeyword: Math.ceil(maxResultsPerSource / keywords.length) || 5 }
      );
      allResults.push(...googleResults);
      console.log(`Google: 获取 ${googleResults.length} 条`);
    } catch (error) {
      console.error('Google 爬取失败:', error.message);
      errors.push({ source: 'Google', error: error.message });
    }
  }

  // 7. DuckDuckGo 搜索爬虫
  if (sources.includes('ddg') && CRAWLER_SOURCES.ddg.enabled) {
    try {
      const ddgResults = await ddgCrawler.crawlDuckDuckGo(
        keywords,
        { resultsPerKeyword: Math.ceil(maxResultsPerSource / keywords.length) || 5 }
      );
      allResults.push(...ddgResults);
      console.log(`DuckDuckGo: 获取 ${ddgResults.length} 条`);
    } catch (error) {
      console.error('DuckDuckGo 爬取失败:', error.message);
      errors.push({ source: 'DuckDuckGo', error: error.message });
    }
  }

  // 8. Twitter 爬虫（需要 API Key）
  if (sources.includes('twitter') && CRAWLER_SOURCES.twitter.enabled) {
    try {
      const twitterResults = await twitterCrawler.crawlTwitter(
        keywords,
        { resultsPerKeyword: Math.ceil(maxResultsPerSource / keywords.length) || 5 }
      );
      allResults.push(...twitterResults);
      console.log(`Twitter: 获取 ${twitterResults.length} 条`);
    } catch (error) {
      console.error('Twitter 爬取失败:', error.message);
      errors.push({ source: 'Twitter', error: error.message });
    }
  }

  // 9. B站爬虫
  if (sources.includes('bilibili') && CRAWLER_SOURCES.bilibili.enabled) {
    try {
      const bilibiliResults = await bilibiliCrawler.crawlBilibili(
        keywords,
        { resultsPerKeyword: Math.ceil(maxResultsPerSource / keywords.length) || 5 }
      );
      allResults.push(...bilibiliResults);
      console.log(`B站: 获取 ${bilibiliResults.length} 条`);
    } catch (error) {
      console.error('B站爬取失败:', error.message);
      errors.push({ source: 'B站', error: error.message });
    }
  }

  // 去重（基于 URL）
  const uniqueResults = removeDuplicates(allResults);

  console.log(`爬取完成，共获取 ${uniqueResults.length} 条唯一结果`);
  if (errors.length > 0) {
    console.error(`部分信息源爬取失败: ${errors.length} 个`);
  }

  return {
    results: uniqueResults,
    sources: sources,
    keywords: keywords,
    totalFetched: allResults.length,
    totalUnique: uniqueResults.length,
    errors: errors
  };
}

/**
 * 去重函数（基于 URL）
 */
function removeDuplicates(results) {
  const seen = new Set();
  return results.filter(item => {
    if (!item.url) return true; // 没有 URL 的不过滤
    const key = item.url.trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 爬取单个信息源
 */
async function crawlSingleSource(source, keywords = [], options = {}) {
  const sourceConfig = CRAWLER_SOURCES[source];

  if (!sourceConfig) {
    throw new Error(`未知的信息源: ${source}`);
  }

  if (!sourceConfig.enabled) {
    throw new Error(`信息源未启用: ${source}`);
  }

  switch (source) {
    case 'hackernews':
      return await hackernewsCrawler.crawlHackerNews(keywords, options.limit);

    case 'bing':
      return await bingCrawler.crawlBing(keywords, options);

    case 'sogou':
      return await sogouCrawler.crawlSogou(keywords, { type: 'web', ...options });

    case 'sogou_wechat':
      return await sogouCrawler.crawlSogou(keywords, { type: 'weixin', ...options });

    case 'weibo':
      return await weiboCrawler.crawlWeibo(keywords, options);

    case 'google':
      return await googleCrawler.crawlGoogle(keywords, options);

    case 'ddg':
      return await ddgCrawler.crawlDuckDuckGo(keywords, options);

    case 'twitter':
      return await twitterCrawler.crawlTwitter(keywords, options);

    case 'bilibili':
      return await bilibiliCrawler.crawlBilibili(keywords, options);

    default:
      throw new Error(`未实现的信息源: ${source}`);
  }
}

/**
 * 获取所有可用的信息源列表
 */
function getAvailableSources() {
  return Object.entries(CRAWLER_SOURCES).map(([key, config]) => ({
    id: key,
    name: config.name,
    enabled: config.enabled,
    priority: config.priority,
    requiresApiKey: config.requiresApiKey,
    requiresCookie: config.requiresCookie
  }));
}

/**
 * 启用/禁用信息源
 */
function toggleSource(sourceId, enabled) {
  if (CRAWLER_SOURCES[sourceId]) {
    CRAWLER_SOURCES[sourceId].enabled = enabled;
    return true;
  }
  return false;
}

// ==================== 保留的旧函数 ====================

// 科技新闻网站列表（保留用于兼容）
const NEWS_SOURCES = [
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    selector: '.post-block'
  },
  {
    name: 'VentureBeat',
    url: 'https://venturebeat.com',
    selector: '.article'
  },
  {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    selector: '.story'
  }
];

const scrapeTechNews = async (keywords) => {
  const results = [];

  for (const source of NEWS_SOURCES) {
    try {
      const response = await axios.get(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const articles = $(source.selector);

      articles.each((index, element) => {
        const title = $(element).find('h2 a, h3 a, .title a').text().trim();
        const link = $(element).find('a').attr('href');

        if (title && link) {
          // 检查标题是否包含关键词
          const hasKeyword = keywords.some(keyword =>
            title.toLowerCase().includes(keyword.toLowerCase())
          );

          if (hasKeyword) {
            results.push({
              title,
              content: '', // 实际内容需要进一步抓取
              source: source.name,
              url: link.startsWith('http') ? link : source.url + link,
              timestamp: new Date()
            });
          }
        }
      });

      // 避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`抓取${source.name}失败:`, error);
    }
  }

  return results;
};

// 获取文章详细内容
const getArticleContent = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // 尝试从不同位置提取内容
    let content = $('article').text() ||
                 $('main').text() ||
                 $('div.content').text() ||
                 $('body').text();

    return content.substring(0, 1000); // 限制内容长度
  } catch (error) {
    console.error('获取文章内容失败:', error);
    return '';
  }
};

// 导出新的爬虫服务接口
module.exports = {
  crawlAllSources,
  crawlSingleSource,
  getAvailableSources,
  toggleSource,
  scrapeTechNews,
  getArticleContent,
  CRAWLER_SOURCES
};
