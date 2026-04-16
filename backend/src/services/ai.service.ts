import axios from 'axios';

interface AIAnalysisResult {
  isAuthentic: boolean;
  confidence: number;
  reasons: string[];
  summary: string;
}

interface AIProvider {
  name: string;
  apiKey: string;
  apiUrl: string;
  model: string;
  headers: Record<string, string>;
}

// 获取AI服务提供商配置
const getAIProvider = (): AIProvider => {
  const provider = process.env.AI_SERVICE_PROVIDER || 'openrouter';

  if (provider === 'deepseek') {
    return {
      name: 'DeepSeek',
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      }
    };
  }

  // 默认使用OpenRouter
  return {
    name: 'OpenRouter',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    apiUrl: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
      'X-Title': process.env.OPENROUTER_TITLE || 'AI Hotspot Monitor',
      'Content-Type': 'application/json'
    }
  };
};

export const analyzeWithAI = async (content: string, source: string): Promise<AIAnalysisResult> => {
  try {
    const provider = getAIProvider();

    if (!provider.apiKey) {
      throw new Error(`${provider.name} API配置缺失`);
    }

    console.log(`使用 ${provider.name} 进行AI分析...`);

    const prompt = `
请分析以下内容的真实性，特别关注AI编程相关的热点信息：

内容来源：${source}
内容文本：
${content}

请回答以下问题：
1. 这段内容是否真实可信？
2. 如果是虚假信息，请指出可能的问题点
3. 如果是真实信息，请确认其可信度
4. 给出整体可信度评分（0-100）

请以JSON格式返回分析结果，包括：
- isAuthentic: boolean (是否真实)
- confidence: number (可信度评分)
- reasons: string[] (分析理由)
- summary: string (简要总结)
    `;

    const response = await axios.post(
      provider.apiUrl,
      {
        model: provider.model,
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      },
      {
        headers: provider.headers
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    // 解析AI返回的JSON结果
    const analysisResult: AIAnalysisResult = JSON.parse(aiResponse);

    console.log(`${provider.name} 分析完成，置信度: ${analysisResult.confidence}%`);

    return analysisResult;
  } catch (error) {
    console.error('AI分析失败:', error);

    // 返回默认的保守结果
    return {
      isAuthentic: false,
      confidence: 0,
      reasons: ['AI分析服务不可用'],
      summary: '无法验证内容真实性'
    };
  }
};

// 快速分析（使用较小的模型）
export const quickAnalyzeWithAI = async (content: string, source: string): Promise<AIAnalysisResult> => {
  try {
    const provider = getAIProvider();

    if (!provider.apiKey) {
      throw new Error(`${provider.name} API配置缺失`);
    }

    const prompt = `
快速分析以下内容的基本真实性：

来源：${source}
内容：${content.substring(0, 300)}

请简短回答：
1. 内容是否基本真实？（是/否/不确定）
2. 简要理由（不超过50字）

返回JSON格式：{ "isAuthentic": boolean, "confidence": number, "reason": string, "summary": string }
    `;

    const response = await axios.post(
      provider.apiUrl,
      {
        model: provider.model,
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: prompt
        }]
      },
      {
        headers: provider.headers
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    const result: AIAnalysisResult = JSON.parse(aiResponse);

    return result;
  } catch (error) {
    console.error('快速AI分析失败:', error);
    return {
      isAuthentic: false,
      confidence: 0,
      reasons: ['快速分析失败'],
      summary: '无法完成快速分析'
    };
  }
};

// 批量分析
export const batchAnalyzeWithAI = async (contents: Array<{content: string, source: string}>): Promise<AIAnalysisResult[]> => {
  const results: AIAnalysisResult[] = [];

  for (const item of contents) {
    const result = await analyzeWithAI(item.content, item.source);
    results.push(result);

    // 避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
};