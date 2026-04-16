const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Google 搜索爬虫服务
 */

const GOOGLE_SEARCH_URL = 'https://www.google.com/search';

/**
 * 构建 Google 搜索查询
 */
function buildGoogleQuery(keyword, options = {}) {
  const {
    count = 10,
    lang = 'zh-CN'
  } = options;

  const params = new URLSearchParams({
    q: keyword,
    num: count.toString(),
    hl: lang,
    lr: 'lang_zh-CN'
  });

  return `${GOOGLE_SEARCH_URL}?${params.toString()}&safe=active`;
}

/**
 * 解析 Google 搜索结果
 */
function parseGoogleResults(html) {
  const $ = cheerio.load(html);
  const results = [];

  // Google 的搜索结果结构
  $('.g .tF2Cxc, .Gx5ZAd, .yuRUbf').each((index, element) => {
    try {
      const $el = $(element);
      const $link = $el.find('a').first();
      const title = $link.text().trim();
      const url = $link.attr('href');
      const $snippet = $el.find('.VwiC3b, .st, .s');
      const snippet = $snippet.text().trim();

      if (title && url && !url.startsWith('#')) {
        // 清理URL（Google 可能包含重定向）
        let cleanUrl = url;
        if (url.startsWith('/url?q=')) {
          const match = url.match(/[&?]url=([^&]+)/);
          if (match) {
            cleanUrl = decodeURIComponent(match[1]);
          }
        }

        results.push({
          title,
          url: cleanUrl,
          snippet,
          source: 'Google'
        });
      }
    } catch (error) {
      // 忽略解析错误
    }
  });

  // 如果上面的选择器不起作用，尝试备用解析
  if (results.length === 0) {
    $('.g').each((index, element) => {
      try {
        const $el = $(element);
        const $link = $el.find('h3 a, a h3').first();
        const title = $link.text().trim();
        const url = $link.attr('href');
        const $container = $el.find('.VwiC3b, .st');
        const snippet = $container.text().trim().substring(0, 200);

        if (title && url) {
          results.push({
            title,
            url: url.startsWith('http') ? url : null,
            snippet,
            source: 'Google'
          });
        }
      } catch (error) {
        // 忽略
      }
    });
  }

  return results.slice(0, 10);
}

/**
 * 搜索关键词
 */
async function searchGoogle(keyword, options = {}) {
  try {
    const searchUrl = buildGoogleQuery(keyword, options);

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      },
      timeout: 15000
    });

    const results = parseGoogleResults(response.data);
    console.log(`Google 搜索 "${keyword}" 找到 ${results.length} 条结果`);

    return results;
  } catch (error) {
    console.error(`Google 搜索 "${keyword}" 失败:`, error.message);

    // 返回模拟数据（由于Google反爬严格）
    return [{
      title: `[模拟] 关于 "${keyword}" 的搜索结果`,
      url: `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
      snippet: `这是关于 ${keyword} 的模拟搜索结果`,
      source: 'Google'
    }];
  }
}

/**
 * 主函数
 */
async function crawlGoogle(keywords = [], options = {}) {
  const {
    resultsPerKeyword = 5,
    maxTotalResults = 50
  } = options;

  try {
    console.log(`开始 Google 搜索，关键词: ${keywords.join(', ')}`);

    const allResults = [];

    // 逐个搜索关键词（避免被限制）
    for (const keyword of keywords) {
      const results = await searchGoogle(keyword, {
        count: resultsPerKeyword
      });

      results.forEach(result => {
        allResults.push({
          ...result,
          keyword: keyword
        });
      });

      // 添加延迟避免被限制
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 转换为统一格式
    const hotspots = allResults.slice(0, maxTotalResults).map((item, index) => ({
      title: item.title,
      content: item.snippet || item.title,
      source: item.source,
      url: item.url,
      timestamp: new Date().toISOString(),
      isVerified: false,
      confidence: 60,
      keywords: [item.keyword],
      metadata: {
        searchEngine: 'Google',
        position: index
      }
    }));

    console.log(`Google 搜索完成，获取 ${hotspots.length} 条结果`);
    return hotspots;
  } catch (error) {
    console.error('Google 搜索失败:', error);
    return [];
  }
}

module.exports = {
  crawlGoogle,
  searchGoogle,
  buildGoogleQuery
};
