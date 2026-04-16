const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Twitter 爬虫服务
 * 注意：Twitter API v2 需要付费
 * 这里提供基础实现，使用官方 API
 */

const TWITTER_API_BASE = 'https://api.twitter.com/2';

/**
 * 从环境变量获取配置
 */
function getTwitterConfig() {
  return {
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
    apiKey: process.env.TWITTER_API_KEY || ''
  };
}

/**
 * 搜索推文（使用 Twitter API v2）
 */
async function searchTweets(query, options = {}) {
  const {
    count = 10,
    lang = 'zh'
  } = options;

  const config = getTwitterConfig();

  if (!config.bearerToken) {
    console.warn('未配置 Twitter Bearer Token，返回模拟数据');
    return getMockTweets(query);
  }

  try {
    const response = await axios.get(`${TWITTER_API_BASE}/tweets/search/recent`, {
      headers: {
        'Authorization': `Bearer ${config.bearerToken}`
      },
      params: {
        query: query,
        max_results: count,
        'tweet.fields': 'created_at,author_id,public_metrics,lang'
      }
    });

    const tweets = response.data.data || [];
    console.log(`Twitter 搜索 "${query}" 找到 ${tweets.length} 条推文`);

    return tweets.map(tweet => ({
      id: tweet.id,
      title: tweet.text,
      content: tweet.text,
      author: tweet.author_id,
      url: `https://twitter.com/i/web/status/${tweet.id}`,
      timestamp: tweet.created_at,
      metrics: tweet.public_metrics
    }));
  } catch (error) {
    console.error(`Twitter 搜索 "${query}" 失败:`, error.message);

    // API 失败时返回模拟数据
    return getMockTweets(query);
  }
}

/**
 * 获取模拟推文数据（无 API Key 时使用）
 */
function getMockTweets(keyword) {
  const mockTweets = [
    {
      id: 'mock-1',
      title: `[模拟] 关于 ${keyword} 的推文`,
      content: `这是一个关于 ${keyword} 的模拟推文内容，用于演示功能。实际使用需要配置 Twitter API。`,
      author: 'demo_user',
      url: 'https://twitter.com',
      timestamp: new Date().toISOString(),
      metrics: { like_count: 10, retweet_count: 5 }
    }
  ];

  return mockTweets;
}

/**
 * 获取热门话题
 */
async function getTrendingTopics(woeid = 1) {
  const config = getTwitterConfig();

  if (!config.bearerToken) {
    console.warn('未配置 Twitter Bearer Token');
    return getMockTrending();
  }

  try {
    const response = await axios.get(`${TWITTER_API_BASE}/trends/list`, {
      headers: {
        'Authorization': `Bearer ${config.bearerToken}`
      },
      params: {
        id: woeid
      }
    });

    return response.data.data[0]?.trends || [];
  } catch (error) {
    console.error('获取 Twitter 热门话题失败:', error.message);
    return [];
  }
}

function getMockTrending() {
  return [
    { name: '#AI', tweet_volume: 50000 },
    { name: '#GPT4', tweet_volume: 30000 },
    { name: '#OpenAI', tweet_volume: 25000 }
  ];
}

/**
 * 主函数
 */
async function crawlTwitter(keywords = [], options = {}) {
  const {
    resultsPerKeyword = 5,
    maxTotalResults = 30,
    includeTrending = false
  } = options;

  try {
    console.log(`开始 Twitter 搜索，关键词: ${keywords.join(', ')}`);

    const allResults = [];

    // 搜索关键词推文
    for (const keyword of keywords) {
      const tweets = await searchTweets(keyword, {
        count: resultsPerKeyword
      });

      tweets.forEach(tweet => {
        allResults.push({
          title: tweet.title,
          content: tweet.content,
          source: 'Twitter',
          url: tweet.url,
          timestamp: new Date(tweet.timestamp).toISOString(),
          isVerified: false,
          confidence: 65,
          keywords: [keyword],
          metadata: {
            platform: 'twitter',
            tweetId: tweet.id,
            author: tweet.author
          }
        });
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 如果启用，添加热门话题
    if (includeTrending) {
      const trends = await getTrendingTopics();

      trends.forEach(trend => {
        if (keywords.some(k => trend.name.toLowerCase().includes(k.toLowerCase()))) {
          allResults.push({
            title: trend.name,
            content: `Twitter 热门话题：${trend.name}`,
            source: 'Twitter Trends',
            url: `https://twitter.com/search?q=${encodeURIComponent(trend.name)}`,
            timestamp: new Date().toISOString(),
            isVerified: true,
            confidence: Math.min(95, 60 + trend.tweet_volume / 1000),
            keywords: keywords.filter(k => trend.name.toLowerCase().includes(k.toLowerCase())),
            metadata: {
              platform: 'twitter',
              type: 'trending',
              volume: trend.tweet_volume
            }
          });
        }
      });
    }

    console.log(`Twitter 爬取完成，获取 ${allResults.length} 条结果`);
    return allResults.slice(0, maxTotalResults);
  } catch (error) {
    console.error('Twitter 爬取失败:', error);
    return [];
  }
}

module.exports = {
  crawlTwitter,
  searchTweets,
  getTrendingTopics
};
