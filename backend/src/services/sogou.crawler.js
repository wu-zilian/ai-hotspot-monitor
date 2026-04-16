const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 搜狗搜索爬虫服务
 * 搜狗搜索特别适合获取微信公众号文章
 */

const SOGOU_SEARCH_URL = 'https://www.sogou.com/web';
const SOGOU_WECHAT_URL = 'https://weixin.sogou.com';

/**
 * 构建搜狗搜索查询
 */
function buildSogouQuery(keyword, options = {}) {
  const {
    type = 'web',  // web=网页, weixin=微信
    count = 10,
    timeFilter = ''  // 时间过滤: time=一天内, week=一周内, month=一月内
  } = options;

  const baseUrl = type === 'weixin' ? SOGOU_WECHAT_URL : SOGOU_SEARCH_URL;

  const params = new URLSearchParams({
    query: keyword,
    ie: 'utf8'
  });

  // 微信搜索特殊路径
  const path = type === 'weixin' ? '/' : '/web';

  return `${baseUrl}${path}?${params.toString()}`;
}

/**
 * 解析搜狗网页搜索结果
 */
function parseSogouWebResults(html) {
  const $ = cheerio.load(html);
  const results = [];

  '.vrwrap, .results .rb'.forEach((selector) => {
    $(selector).each((index, element) => {
      try {
        const $el = $(element);
        const $link = $el.find('h3 a').first();
        const title = $link.text().trim();
        const url = $link.attr('href');

        // 获取摘要
        const $snippet = $el.find('.str_info, .ft, .st');
        const snippet = $snippet.text().trim();

        if (title && url) {
          results.push({
            title,
            url: url.startsWith('http') ? url : null,
            snippet,
            source: '搜狗搜索'
          });
        }
      } catch (error) {
        // 忽略解析错误
      }
    });
  });

  // 通用解析方案
  if (results.length === 0) {
    $('.results > div').each((index, element) => {
      try {
        const $el = $(element);
        const $link = $el.find('a').first();
        const title = $link.text().trim();
        const url = $link.attr('href');

        if (title && url && url.startsWith('http')) {
          results.push({
            title,
            url,
            snippet: $el.text().replace(title, '').trim(),
            source: '搜狗搜索'
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
 * 解析搜狗微信搜索结果
 */
function parseSogouWechatResults(html) {
  const $ = cheerio.load(html);
  const results = [];

  $('.news-box .news-list li').each((index, element) => {
    try {
      const $el = $(element);
      const $link = $el.find('h3 a').first();
      const title = $link.text().trim();
      const url = $link.attr('href');

      // 公众号名称
      const $account = $el.find('.account');
      const account = $account.text().trim();

      // 摘要
      const $snippet = $el.find('.txt-info');
      const snippet = $snippet.text().trim();

      // 时间
      const $time = $el.find('.s2');
      const time = $time.text().trim();

      if (title && url) {
        results.push({
          title,
          url,
          snippet,
          source: `微信公众号 - ${account || '未知'}`,
          account,
          publishTime: time,
          metadata: {
            platform: 'wechat',
            account: account
          }
        });
      }
    } catch (error) {
      console.error('解析微信结果出错:', error.message);
    }
  });

  return results;
}

/**
 * 搜索单个关键词（网页搜索）
 */
async function searchSogouWeb(keyword, options = {}) {
  try {
    const searchUrl = buildSogouQuery(keyword, { type: 'web', ...options });

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      },
      timeout: 10000
    });

    const results = parseSogouWebResults(response.data);
    console.log(`搜狗搜索 "${keyword}" 找到 ${results.length} 条结果`);

    return results;
  } catch (error) {
    console.error(`搜狗搜索 "${keyword}" 失败:`, error.message);
    return [];
  }
}

/**
 * 搜索微信公众号文章
 */
async function searchSogouWechat(keyword, options = {}) {
  try {
    const searchUrl = buildSogouQuery(keyword, { type: 'weixin', ...options });

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://weixin.sogou.com/'
      },
      timeout: 10000
    });

    const results = parseSogouWechatResults(response.data);
    console.log(`搜狗微信搜索 "${keyword}" 找到 ${results.length} 条结果`);

    return results;
  } catch (error) {
    console.error(`搜狗微信搜索 "${keyword}" 失败:`, error.message);
    return [];
  }
}

/**
 * 主函数：使用搜狗搜索多个关键词
 * @param {Array<string>} keywords - 关键词列表
 * @param {Object} options - 搜索选项
 */
async function crawlSogou(keywords = [], options = {}) {
  const {
    type = 'web',  // web 或 weixin
    resultsPerKeyword = 5,
    maxTotalResults = 50
  } = options;

  try {
    console.log(`开始搜狗${type === 'weixin' ? '微信' : ''}搜索，关键词: ${keywords.join(', ')}`);

    const allResults = [];

    // 根据类型选择搜索函数
    const searchFunc = type === 'weixin' ? searchSogouWechat : searchSogouWeb;

    // 并发搜索所有关键词
    const searchPromises = keywords.map(keyword =>
      searchFunc(keyword, { count: resultsPerKeyword })
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
      source: item.source,
      url: item.url,
      timestamp: item.publishTime || new Date().toISOString(),
      isVerified: false,
      confidence: type === 'weixin' ? 70 : 60, // 微信公众号内容置信度稍高
      keywords: [item.keyword],
      metadata: {
        searchEngine: 'Sogou',
        type: type,
        platform: item.metadata?.platform || 'web',
        account: item.account,
        position: index
      }
    }));

    console.log(`搜狗搜索完成，获取 ${hotspots.length} 条结果`);
    return hotspots;
  } catch (error) {
    console.error('搜狗搜索失败:', error);
    return [];
  }
}

module.exports = {
  crawlSogou,
  searchSogouWeb,
  searchSogouWechat,
  buildSogouQuery
};
