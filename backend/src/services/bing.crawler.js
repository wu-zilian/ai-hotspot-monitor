const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Bing 搜索爬虫服务
 * 使用 Bing 搜索 API 或网页抓取
 */

const BING_SEARCH_URL = 'https://www.bing.com/search';

/**
 * 构建 Bing 搜索查询
 */
function buildSearchQuery(keyword, options = {}) {
  const {
    count = 10,
    offset = 0,
    freshness = 'w'  // d=day, w=week, m=month
  } = options;

  const params = new URLSearchParams({
    q: keyword,
    count: count.toString(),
    first: (offset + 1).toString(),
    setlang: 'zh-CN',
    cc: 'CN'
  });

  // 添加时间过滤
  if (freshness) {
    params.append('filters', `ex1:"ez${freshness}"`);
  }

  return `${BING_SEARCH_URL}?${params.toString()}`;
}

/**
 * 解析 Bing 搜索结果页面
 */
function parseBingResults(html) {
  const $ = cheerio.load(html);
  const results = [];

  $('.b_algo').each((index, element) => {
    try {
      const $el = $(element);
      const $link = $el.find('h2 a').first();

      const title = $link.text().trim();
      const url = $link.attr('href');
      const $snippet = $el.find('.b_caption p');
      const snippet = $snippet.text().trim();

      if (title && url) {
        results.push({
          title,
          url,
          snippet,
          source: 'Bing'
        });
      }
    } catch (error) {
      console.error('解析 Bing 结果出错:', error.message);
    }
  });

  return results;
}

/**
 * 搜索单个关键词
 */
async function searchKeyword(keyword, options = {}) {
  try {
    const searchUrl = buildSearchQuery(keyword, options);

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });

    const results = parseBingResults(response.data);
    console.log(`Bing 搜索 "${keyword}" 找到 ${results.length} 条结果`);

    return results;
  } catch (error) {
    console.error(`Bing 搜索 "${keyword}" 失败:`, error.message);
    return [];
  }
}

/**
 * 主函数：使用 Bing 搜索多个关键词
 * @param {Array<string>} keywords - 关键词列表
 * @param {Object} options - 搜索选项
 */
async function crawlBing(keywords = [], options = {}) {
  const {
    resultsPerKeyword = 5,
    maxTotalResults = 50
  } = options;

  try {
    console.log(`开始 Bing 搜索，关键词: ${keywords.join(', ')}`);

    const allResults = [];

    // 并发搜索所有关键词
    const searchPromises = keywords.map(keyword =>
      searchKeyword(keyword, { count: resultsPerKeyword })
    );

    const searchResults = await Promise.all(searchPromises);

    // 合并所有结果
    searchResults.forEach((results, index) => {
      results.forEach(result => {
        allResults.push({
          ...result,
          keyword: keywords[index]
        });
      });
    });

    // 转换为统一格式
    const hotspots = allResults.slice(0, maxTotalResults).map((item, index) => ({
      title: item.title,
      content: item.snippet || item.title,
      source: `${item.source} (${item.keyword})`,
      url: item.url,
      timestamp: new Date().toISOString(),
      isVerified: false, // 需要进一步验证
      confidence: 60, // 搜索结果置信度较低
      keywords: [item.keyword],
      metadata: {
        searchEngine: 'Bing',
        position: index
      }
    }));

    console.log(`Bing 搜索完成，获取 ${hotspots.length} 条结果`);
    return hotspots;
  } catch (error) {
    console.error('Bing 搜索失败:', error);
    return [];
  }
}

/**
 * 使用 Bing News API 搜索新闻（如果有 API Key）
 */
async function searchBingNews(keyword, options = {}) {
  const apiKey = process.env.BING_API_KEY;
  if (!apiKey) {
    console.warn('未配置 BING_API_KEY，跳过 Bing News API');
    return [];
  }

  try {
    const endpoint = 'https://api.bing.microsoft.com/v7.0/news/search';
    const response = await axios.get(endpoint, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey
      },
      params: {
        q: keyword,
        count: options.count || 10,
        offset: options.offset || 0,
        mkt: 'zh-CN',
        safeSearch: 'Moderate'
      }
    });

    return response.data.value?.map(item => ({
      title: item.name,
      content: item.description,
      source: `Bing News - ${item.provider[0]?.name || 'Unknown'}`,
      url: item.url,
      timestamp: item.datePublished || new Date().toISOString(),
      image: item.image?.thumbnailUrl,
      metadata: {
        bingNews: true,
        provider: item.provider
      }
    })) || [];
  } catch (error) {
    console.error('Bing News API 调用失败:', error.message);
    return [];
  }
}

module.exports = {
  crawlBing,
  searchKeyword,
  searchBingNews,
  buildSearchQuery
};
