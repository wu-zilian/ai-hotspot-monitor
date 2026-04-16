const axios = require('axios');
const cheerio = require('cheerio');

/**
 * DuckDuckGo 搜索爬虫服务
 * DuckDuckGo 不需要 API Key，隐私友好
 */

const DDG_SEARCH_URL = 'https://html.duckduckgo.com/html/';

/**
 * 构建 DuckDuckGo 搜索查询
 */
function buildDDGQuery(keyword, options = {}) {
  const {
    locale = 'zh-CN'
  } = options;

  const params = new URLSearchParams({
    q: keyword
  });

  return `${DDG_SEARCH_URL}?${params.toString()}`;
}

/**
 * 解析 DuckDuckGo 搜索结果
 */
function parseDDGResults(html) {
  const $ = cheerio.load(html);
  const results = [];

  $('.result, .web-result').each((index, element) => {
    try {
      const $el = $(element);
      const $link = $el.find('a.result__a, .result__url').first();
      const title = $link.text().trim();
      const url = $link.attr('href');
      const $snippet = $el.find('.result__snippet, .result__description');
      const snippet = $snippet.text().trim();

      if (title && url && !url.startsWith('#')) {
        results.push({
          title,
          url: url.startsWith('http') ? url : `https:${url}`,
          snippet,
          source: 'DuckDuckGo'
        });
      }
    } catch (error) {
      // 忽略解析错误
    }
  });

  return results.slice(0, 10);
}

/**
 * 搜索关键词
 */
async function searchDDG(keyword, options = {}) {
  try {
    const searchUrl = buildDDGQuery(keyword, options);

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive'
      },
      timeout: 15000
    });

    const results = parseDDGResults(response.data);
    console.log(`DuckDuckGo 搜索 "${keyword}" 找到 ${results.length} 条结果`);

    return results;
  } catch (error) {
    console.error(`DuckDuckGo 搜索 "${keyword}" 失败:`, error.message);
    return [];
  }
}

/**
 * 主函数
 */
async function crawlDuckDuckGo(keywords = [], options = {}) {
  const {
    resultsPerKeyword = 5,
    maxTotalResults = 50
  } = options;

  try {
    console.log(`开始 DuckDuckGo 搜索，关键词: ${keywords.join(', ')}`);

    const allResults = [];

    for (const keyword of keywords) {
      const results = await searchDDG(keyword, {
        count: resultsPerKeyword
      });

      results.forEach(result => {
        allResults.push({
          ...result,
          keyword: keyword
        });
      });

      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // 转换为统一格式
    const hotspots = allResults.slice(0, maxTotalResults).map((item, index) => ({
      title: item.title,
      content: item.snippet || item.title,
      source: item.source,
      url: item.url,
      timestamp: new Date().toISOString(),
      isVerified: false,
      confidence: 65, // DuckDuckGo 隐私友好，数据质量较高
      keywords: [item.keyword],
      metadata: {
        searchEngine: 'DuckDuckGo',
        position: index,
        privacyFocused: true
      }
    }));

    console.log(`DuckDuckGo 搜索完成，获取 ${hotspots.length} 条结果`);
    return hotspots;
  } catch (error) {
    console.error('DuckDuckGo 搜索失败:', error);
    return [];
  }
}

module.exports = {
  crawlDuckDuckGo,
  searchDDG
};
