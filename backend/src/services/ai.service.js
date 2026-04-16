const axios = require('axios');

// 获取AI服务提供商配置
const getAIProvider = () => {
  const provider = process.env.AI_SERVICE_PROVIDER || 'glm';  // 默认使用GLM

  if (provider === 'glm') {
    return {
      name: 'GLM',
      apiKey: process.env.GLM_API_KEY || '',
      apiUrl: process.env.GLM_API_URL || 'https://new-api-test.igancao.cn/v1/chat/completions',
      model: process.env.GLM_MODEL || 'glm-4.7',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GLM_API_KEY || 'sk-test'}`
      }
    };
  }

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

  // OpenRouter（备用）
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

exports.analyzeWithAI = async (content, source) => {
  try {
    const provider = getAIProvider();

    if (!provider.apiKey) {
      throw new Error(`${provider.name} API配置缺失`);
    }

    console.log(`使用 ${provider.name} 进行AI分析...`);

    const prompt = `请分析以下内容的真实性，特别关注AI编程相关的热点信息：

内容来源：${source}
内容文本：
${content}

请回答以下问题：
1. 这段内容是否真实可信？
2. 如果是虚假信息，请指出可能的问题点
3. 如果是真实信息，请确认其可信度
4. 给出整体可信度评分（0-100）

请严格按照以下JSON格式返回分析结果：
{
  "verification": {
    "status": "verified" | "unverified" | "suspicious" | "unknown",
    "isAuthentic": boolean,
    "confidence": number (0-100),
    "level": "high" | "medium" | "low"
  },
  "analysis": {
    "summary": string (简要总结),
    "reasons": string[] (分析理由),
    "indicators": {
      "hasSource": boolean,
      "hasAuthor": boolean,
      "hasDate": boolean,
      "isOfficial": boolean
    }
  }
}

验证状态说明：
- verified: 已验证，内容真实可信
- unverified: 未验证，需要进一步确认
- suspicious: 可疑，存在虚假信息迹象
- unknown: 未知，无法判断`;

    const response = await axios.post(
      provider.apiUrl,
      {
        model: provider.model,
        max_tokens: 2000,
        messages: [{
          role: 'system',
          content: '你是一个专业的AI内容验证助手。请严格按照JSON格式返回验证结果，确保包含verification和analysis两个顶级字段。'
        }, {
          role: 'user',
          content: prompt
        }]
      },
      {
        headers: provider.headers,
        timeout: 60000  // 增加超时时间到60秒
      }
    );

    console.log(`${provider.name} API响应状态:`, response.status);

    // 检查响应格式
    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      throw new Error('API响应格式不正确');
    }

    const aiResponse = response.data.choices[0].message.content;
    console.log(`${provider.name} AI原始响应长度:`, aiResponse.length);
    console.log(`${provider.name} AI原始响应前200字符:`, aiResponse.substring(0, 200));

    // 解析AI返回的JSON结果
    let analysisResult;
    try {
      // 尝试直接解析
      analysisResult = JSON.parse(aiResponse);
    } catch (parseError) {
      // 尝试提取JSON（处理markdown代码块）
      let jsonText = aiResponse;

      // 移除markdown代码块标记
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '');

      // 尝试提取JSON对象
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析AI响应为JSON');
      }
    }

    // 标准化level：基于confidence和isAuthentic统一计算
    const calculateLevel = (confidence, isAuthentic) => {
      if (confidence >= 80) return 'high';
      if (confidence >= 50) return 'medium';
      return 'low';
    };

    // 如果是虚假内容但置信度很高，level应该反映验证的可靠性，而非内容的真实性
    // 所以level主要表示"我们对这个判断的置信度"
    const normalizedLevel = calculateLevel(
      analysisResult.verification?.confidence ?? 70,
      analysisResult.verification?.isAuthentic ?? true
    );

    const standardizedResult = {
      isAuthentic: analysisResult.verification?.isAuthentic ?? true,
      confidence: analysisResult.verification?.confidence ?? 70,
      summary: analysisResult.analysis?.summary ?? '内容已分析',
      reasons: analysisResult.analysis?.reasons ?? [`来源: ${source}`],
      verification: {
        status: analysisResult.verification?.status ?? 'unknown',
        isAuthentic: analysisResult.verification?.isAuthentic ?? true,
        confidence: analysisResult.verification?.confidence ?? 70,
        level: normalizedLevel  // 使用标准化后的level
      },
      analysis: {
        summary: analysisResult.analysis?.summary ?? '内容已分析',
        reasons: analysisResult.analysis?.reasons ?? [`来源: ${source}`],
        indicators: analysisResult.analysis?.indicators ?? {}
      }
    };

    console.log(`${provider.name} 分析完成，验证状态: ${standardizedResult.verification.status}, 置信度: ${standardizedResult.confidence}%, level: ${normalizedLevel}`);

    return standardizedResult;
  } catch (error) {
    console.error('AI分析失败:', error.message);
    console.error('错误详情:', error.response?.data || error.code || error);

    // 返回默认的保守结果
    return {
      isAuthentic: false,
      confidence: 0,
      summary: '无法验证内容真实性',
      reasons: [`AI分析服务不可用: ${error.message}`],
      verification: {
        status: 'unknown',
        isAuthentic: false,
        confidence: 0,
        level: 'low'
      },
      analysis: {
        summary: '无法验证内容真实性',
        reasons: [`AI分析服务不可用: ${error.message}`],
        indicators: {}
      }
    };
  }
};

// 快速分析（使用较小的模型）
exports.quickAnalyzeWithAI = async (content, source) => {
  try {
    const provider = getAIProvider();

    if (!provider.apiKey || provider.apiKey === 'sk-test') {
      console.warn('API Key未配置或使用测试密钥，跳过AI分析');
      throw new Error(`${provider.name} API配置缺失或使用测试密钥`);
    }

    console.log(`[AI分析] 正在调用${provider.name} API...`);
    console.log(`[AI分析] 内容长度: ${content.length}, 来源: ${source}`);

    // 使用简洁的prompt，要求模型直接返回JSON
    const prompt = `请判断以下内容的真实性并评分（0-100分）。

内容：${content.substring(0, 150)}
来源：${source}

要求：直接返回JSON，不要任何解释和推理过程：
{"isAuthentic":true,"confidence":75,"reason":"简短理由","summary":"内容摘要"}`;

    const response = await axios.post(
      provider.apiUrl,
      {
        model: provider.model,
        messages: [{
          role: 'system',
          content: '你是一个内容真实性评估助手。请直接返回JSON格式的分析结果，不要包含任何推理过程或解释。'
        }, {
          role: 'user',
          content: prompt
        }],
        max_tokens: 300,
        temperature: 0.1
      },
      {
        headers: provider.headers,
        timeout: 35000  // 增加到35秒
      }
    );

    // 获取响应
    const message = response.data.choices[0].message;
    let aiResponse = message.content || message.reasoning_content || '';

    console.log(`[AI分析] 响应长度: ${aiResponse.length}`);

    if (!aiResponse || aiResponse.trim() === '') {
      console.warn('[AI分析] API响应为空');
      const confidence = source.includes('HackerNews') ? 70 : 50;
      return {
        isAuthentic: confidence > 60,
        confidence: confidence,
        reasons: ['AI响应为空'],
        summary: content.substring(0, 100)
      };
    }

    // 尝试提取JSON - 查找最后一个完整的JSON对象
    let result;
    try {
      // 方法1: 查找包含关键字的JSON
      let jsonMatch = aiResponse.match(/\{[^{}]*"isAuthentic"[^{}]*\}/);

      // 方法2: 如果没找到，尝试匹配所有JSON对象
      if (!jsonMatch) {
        const allJson = aiResponse.match(/\{[^{}]*"[^"]*"[^{}]*:[^{}]*\}/g);
        if (allJson && allJson.length > 0) {
          jsonMatch = allJson[allJson.length - 1]; // 取最后一个
        }
      }

      // 方法3: 如果还是没找到，尝试匹配更大的JSON对象
      if (!jsonMatch) {
        const bigJson = aiResponse.match(/\{[^{}]*\{[^{}]*\}[^{}]*\}/g);
        if (bigJson && bigJson.length > 0) {
          jsonMatch = bigJson[bigJson.length - 1];
        }
      }

      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
        console.log('[AI分析] JSON解析成功:', result);
      } else {
        throw new Error('未找到有效的JSON格式');
      }
    } catch (parseError) {
      console.warn('[AI分析] JSON解析失败:', parseError.message);
      console.warn('[AI分析] 响应末尾:', aiResponse.slice(-200));

      // 返回基于来源的评分
      const confidence = source.includes('HackerNews') ? 70 : 50;
      return {
        isAuthentic: confidence > 60,
        confidence: confidence,
        reasons: [`JSON解析失败 - 来源: ${source}`],
        summary: content.substring(0, 100)
      };
    }

    // 返回标准格式
    return {
      isAuthentic: Boolean(result.isAuthentic),
      confidence: Number(result.confidence) || 50,
      reasons: [result.reason || 'AI分析'],
      summary: result.summary || content.substring(0, 100)
    };
  } catch (error) {
    console.error('[AI分析] 调用失败:', error.message);
    if (error.code === 'ECONNABORTED') {
      console.error('[AI分析] 请求超时（35秒）');
    }

    // 返回基于来源的评分
    const confidence = source.includes('HackerNews') ? 70 : 50;
    return {
      isAuthentic: confidence > 60,
      confidence: confidence,
      reasons: [`AI分析失败 - 来源: ${source}`],
      summary: content.substring(0, 100)
    };
  }
};

// 批量分析
exports.batchAnalyzeWithAI = async (contents) => {
  const results = [];

  for (const item of contents) {
    const result = await exports.analyzeWithAI(item.content, item.source);
    results.push(result);

    // 避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
};
