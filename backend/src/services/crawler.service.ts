import axios from 'axios';
import cheerio from 'cheerio';
import { setTimeout as sleep } from 'timers/promises';

interface ScrapedContent {
  title: string;
  content: string;
  source: string;
  url: string;
  timestamp: Date;
}

// 科技新闻网站列表
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

export const scrapeTechNews = async (keywords: string[]): Promise<ScrapedContent[]> => {
  const results: ScrapedContent[] = [];

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
      await sleep(1000);
    } catch (error) {
      console.error(`抓取${source.name}失败:`, error);
    }
  }

  return results;
};

// 获取文章详细内容
export const getArticleContent = async (url: string): Promise<string> => {
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