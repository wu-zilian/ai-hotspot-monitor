const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 微博搜索爬虫服务
 * 注意：微博有较强的反爬机制，可能需要配置 Cookie
 */

const WEIBO_SEARCH_URL = 'https://s.weibo.com/weibo';

/**
 * 微博搜索配置
 */
const weiboConfig = {
  // 从环境变量获取 Cookie，或使用默认值
  cookie: process.env.WEIBO_COOKIE || '',
  // 请求延迟（毫秒）
  delay: 2000,
  // 最大重试次数
  maxRetries: 3
};

/**
 * 构建微博搜索查询
 */
function buildWeiboQuery(keyword, options = {}) {
  const {
    type = 'weibo',  // weibo=微博, user=用户, hot=热搜
    scope = 'ori',   // ori=原创, all=全部
    page = 1
  } = options;

  const params = new URLSearchParams({
    q: keyword,
    type: type,
    page: page.toString(),
    scope: scope
  });

  return `${WEIBO_SEARCH_URL}?${params.toString()}`;
}

/**
 * 解析微博搜索结果
 */
function parseWeiboResults(html) {
  const $ = cheerio.load(html);
  const results = [];

  $('.card-wrap').each((index, element) => {
    try {
      const $el = $(element);

      // 跳过广告和推荐
      if ($el.find('.ad').length > 0) return;

      // 微博内容
      const $content = $el.find('.card-wrap .card-con');
      const text = $content.find('.txt').text().trim();

      // 作者信息
      const $author = $content.find('.info .name');
      const author = $author.text().trim();
      const authorUrl = $author.attr('href');

      // 发布时间
      const $time = $content.find('.info .time');
      const time = $time.text().trim();
      const timeLink = $time.attr('href');

      // 点赞、转发、评论数
      const $actions = $el.find('.card-act');
      const likes = $actions.find('li:nth-child(1) a').text().trim() || '0';
      const comments = $actions.find('li:nth-child(2) a').text().trim() || '0';
      const shares = $actions.find('li:nth-child(3) a').text().trim() || '0';

      // 构建微博链接
      const mid = $el.attr('mid');
      const url = mid ? `https://weibo.com/${authorUrl?.split('/')?.[1] || ''}/${mid}` : null;

      if (text) {
        results.push({
          title: text.substring(0, 100), // 前100字作为标题
          content: text,
          source: `微博 - ${author}`,
          url: url,
          author: author,
          publishTime: time,
          likes: parseInt(likes) || 0,
          comments: parseInt(comments) || 0,
          shares: parseInt(shares) || 0,
          metadata: {
            platform: 'weibo',
            mid: mid,
            authorUrl: authorUrl
          }
        });
      }
    } catch (error) {
      console.error('解析微博结果出错:', error.message);
    }
  });

  return results;
}

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 搜索单个关键词
 */
async function searchWeibo(keyword, options = {}) {
  const { page = 1, retries = 0 } = options;

  try {
    const searchUrl = buildWeiboQuery(keyword, { page, ...options });

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Referer': 'https://weibo.com',
      'Upgrade-Insecure-Requests': '1'
    };

    // 添加 Cookie（如果有）
    if (weiboConfig.cookie) {
      headers['Cookie'] = weiboConfig.cookie;
    }

    const response = await axios.get(searchUrl, {
      headers,
      timeout: 15000
    });

    const results = parseWeiboResults(response.data);
    console.log(`微博搜索 "${keyword}" (第${page}页) 找到 ${results.length} 条结果`);

    return results;
  } catch (error) {
    // 检查是否需要重试
    if (retries < weiboConfig.maxRetries && (
      error.response?.status === 418 ||
      error.response?.status === 429 ||
      error.code === 'ETIMEDOUT'
    )) {
      console.log(`微博搜索被限制，${weiboConfig.delay / 1000}秒后重试... (${retries + 1}/${weiboConfig.maxRetries})`);
      await delay(weiboConfig.delay);
      return searchWeibo(keyword, { ...options, retries: retries + 1 });
    }

    console.error(`微博搜索 "${keyword}" 失败:`, error.message);
    return [];
  }
}

/**
 * 获取微博热搜榜（不需要 Cookie）
 */
async function getWeiboHotTrends() {
  try {
    const url = 'https://s.weibo.com/top/summary';

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const trends = [];

    $('#pl_top_realtimehot table tbody tr').each((index, element) => {
      if (index === 0) return; // 跳过表头

      const $el = $(element);
      const $link = $el.find('td a').first();
      const title = $link.text().trim();
      const url = $link.attr('href');
      const rank = $el.find('td:nth-child(1)').text().trim();
      const hotValue = $el.find('td:nth-child(2) span').text().trim();
      const category = $el.find('td:nth-child(3) i').text().trim() || '综合';

      if (title) {
        trends.push({
          rank: parseInt(rank) || index,
          title: title,
          url: url ? `https://s.weibo.com${url}` : null,
          hotValue: hotValue,
          category: category,
          source: '微博热搜'
        });
      }
    });

    console.log(`获取微博热搜榜，共 ${trends.length} 条`);
    return trends;
  } catch (error) {
    console.error('获取微博热搜榜失败:', error.message);
    return [];
  }
}

/**
 * 主函数：使用微博搜索多个关键词
 * @param {Array<string>} keywords - 关键词列表
 * @param {Object} options - 搜索选项
 */
async function crawlWeibo(keywords = [], options = {}) {
  const {
    resultsPerKeyword = 5,
    maxTotalResults = 50,
    includeHotTrends = true
  } = options;

  try {
    console.log(`开始微博搜索，关键词: ${keywords.join(', ')}`);

    const allResults = [];

    // 如果启用热搜榜
    if (includeHotTrends) {
      const trends = await getWeiboHotTrends();

      // 根据关键词过滤热搜
      const filteredTrends = keywords.length > 0
        ? trends.filter(trend =>
            keywords.some(keyword =>
              trend.title.toLowerCase().includes(keyword.toLowerCase())
            )
          )
        : trends;

      filteredTrends.forEach(trend => {
        allResults.push({
          title: trend.title,
          content: `热搜#${trend.rank} 热度:${trend.hotValue}`,
          source: `${trend.source} - ${trend.category}`,
          url: trend.url,
          timestamp: new Date().toISOString(),
          isVerified: true,
          confidence: Math.min(95, 60 + trend.rank), // 排名越前置信度越高
          keywords: keywords.filter(k =>
            trend.title.toLowerCase().includes(k.toLowerCase())
          ),
          metadata: {
            platform: 'weibo',
            type: 'hot_trend',
            rank: trend.rank,
            hotValue: trend.hotValue,
            category: trend.category
          }
        });
      });
    }

    // 搜索关键词（如果有 Cookie）
    if (keywords.length > 0 && weiboConfig.cookie) {
      // 逐个搜索关键词（避免被限流）
      for (const keyword of keywords) {
        await delay(weiboConfig.delay);
        const results = await searchWeibo(keyword, {
          page: 1,
          scope: 'ori'
        });

        results.slice(0, resultsPerKeyword).forEach(result => {
          allResults.push({
            title: result.title,
            content: result.content,
            source: result.source,
            url: result.url,
            timestamp: new Date().toISOString(),
            isVerified: false,
            confidence: 65,
            keywords: [keyword],
            metadata: {
              platform: 'weibo',
              type: 'search',
              author: result.author,
              likes: result.likes,
              comments: result.comments,
              shares: result.shares
            }
          });
        });
      }
    } else if (keywords.length > 0 && !weiboConfig.cookie) {
      console.warn('未配置 WEIBO_COOKIE，跳过微博关键词搜索');
    }

    console.log(`微博搜索完成，获取 ${allResults.length} 条结果`);
    return allResults.slice(0, maxTotalResults);
  } catch (error) {
    console.error('微博搜索失败:', error);
    return [];
  }
}

module.exports = {
  crawlWeibo,
  searchWeibo,
  getWeiboHotTrends,
  buildWeiboQuery
};
