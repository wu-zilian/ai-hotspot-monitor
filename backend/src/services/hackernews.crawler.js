const axios = require('axios');

/**
 * HackerNews 爬虫服务
 * HackerNews 有官方 API，不需要爬取 HTML
 * API 文档: https://github.com/HackerNews/API
 */

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

/**
 * 获取最新的故事ID列表
 */
async function getNewStoryIds(limit = 30) {
  try {
    const response = await axios.get(`${HN_API_BASE}/newstories.json`);
    const storyIds = response.data.slice(0, limit);
    return storyIds;
  } catch (error) {
    console.error('获取 HackerNews 故事ID失败:', error.message);
    return [];
  }
}

/**
 * 获取单个故事的详细信息
 */
async function getStoryItem(storyId) {
  try {
    const response = await axios.get(`${HN_API_BASE}/item/${storyId}.json`);
    return response.data;
  } catch (error) {
    console.error(`获取故事 ${storyId} 详情失败:`, error.message);
    return null;
  }
}

/**
 * 根据关键词过滤故事
 */
function filterByKeywords(story, keywords) {
  if (!keywords || keywords.length === 0) return true;

  const searchText = `${story.title} ${story.text || ''}`.toLowerCase();
  return keywords.some(keyword =>
    searchText.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * 主函数：爬取 HackerNews 热点
 * @param {Array<string>} keywords - 关键词列表
 * @param {number} limit - 获取数量
 */
async function crawlHackerNews(keywords = [], limit = 30) {
  try {
    console.log(`开始爬取 HackerNews，关键词: ${keywords.join(', ')}`);

    // 获取最新故事ID
    const storyIds = await getNewStoryIds(limit);
    console.log(`获取到 ${storyIds.length} 个故事ID`);

    // 并发获取所有故事详情
    const storyPromises = storyIds.map(id => getStoryItem(id));
    const stories = await Promise.all(storyPromises);

    // 过滤有效故事
    const validStories = stories.filter(story =>
      story && story.type === 'story' && story.title
    );

    // 根据关键词过滤
    let filteredStories = validStories;
    if (keywords.length > 0) {
      filteredStories = validStories.filter(story =>
        filterByKeywords(story, keywords)
      );
      console.log(`关键词过滤后剩余 ${filteredStories.length} 个故事`);
    }

    // 转换为统一格式
    const hotspots = filteredStories.map(story => ({
      title: story.title,
      content: story.text || story.title,
      source: 'HackerNews',
      url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
      timestamp: new Date(story.time * 1000).toISOString(),
      isVerified: true, // HackerNews 内容相对可信
      confidence: 85, // 默认置信度
      keywords: keywords.filter(k =>
        `${story.title} ${story.text || ''}`.toLowerCase().includes(k.toLowerCase())
      ),
      metadata: {
        hnId: story.id,
        score: story.score,
        descendants: story.descendants,
        author: story.by
      }
    }));

    console.log(`HackerNews 爬取完成，获取 ${hotspots.length} 条热点`);
    return hotspots;
  } catch (error) {
    console.error('HackerNews 爬取失败:', error);
    return [];
  }
}

/**
 * 获取热门故事（基于点赞数）
 */
async function getTopStories(keywords = [], limit = 10) {
  try {
    const response = await axios.get(`${HN_API_BASE}/topstories.json`);
    const storyIds = response.data.slice(0, limit * 2); // 获取更多以供过滤

    const storyPromises = storyIds.map(id => getStoryItem(id));
    const stories = await Promise.all(storyPromises);

    const validStories = stories.filter(story =>
      story && story.type === 'story' && story.title
    );

    // 根据关键词过滤
    let filteredStories = validStories;
    if (keywords.length > 0) {
      filteredStories = validStories.filter(story =>
        filterByKeywords(story, keywords)
      );
    }

    return filteredStories.slice(0, limit).map(story => ({
      title: story.title,
      content: story.text || story.title,
      source: 'HackerNews',
      url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
      timestamp: new Date(story.time * 1000).toISOString(),
      isVerified: true,
      confidence: 90, // 热门故事置信度更高
      keywords: keywords.filter(k =>
        `${story.title} ${story.text || ''}`.toLowerCase().includes(k.toLowerCase())
      ),
      metadata: {
        hnId: story.id,
        score: story.score,
        descendants: story.descendants,
        author: story.by,
        rank: 'top'
      }
    }));
  } catch (error) {
    console.error('获取 HackerNews 热门故事失败:', error);
    return [];
  }
}

module.exports = {
  crawlHackerNews,
  getTopStories,
  getNewStoryIds,
  getStoryItem
};
