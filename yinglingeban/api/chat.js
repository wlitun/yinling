const axios = require('axios');

// 从环境变量获取API密钥
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

module.exports = async (req, res) => {
  // CORS配置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { message, type = 'chat' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    if (!DASHSCOPE_API_KEY) {
      return res.status(200).json({ 
        success: true, 
        reply: getFallbackReply(type),
        note: "请配置API密钥以体验完整AI功能"
      });
    }
    
    // 调用通义千问API
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'system',
              content: getSystemPrompt(type)
            },
            {
              role: 'user',
              content: message
            }
          ]
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 1500
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const aiReply = response.data.output.choices[0].message.content;
    
    res.status(200).json({ 
      success: true, 
      reply: aiReply
    });
    
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(200).json({ 
      success: true, 
      reply: getFallbackReply(req.body?.type || 'chat'),
      note: "使用备用回复"
    });
  }
};

function getSystemPrompt(type) {
  const prompts = {
    recipe: `作为专业老年营养师，请根据用户需求生成健康食谱，格式清晰。`,
    'nursing-home': `作为专业养老顾问，请根据用户需求推荐合适的养老院。`,
    chat: `作为老年人陪伴助手，用温暖、耐心的语气交流，提供情感支持。`
  };
  return prompts[type] || prompts.chat;
}

function getFallbackReply(type) {
  const replies = {
    chat: [
      "今天天气不错，适合出去散散步呢。",
      "我理解您的感受，很多人都有类似的经历。",
      "保持积极心态对健康很重要。"
    ],
    recipe: "推荐燕麦蔬菜粥：燕麦片50g，胡萝卜、青菜适量，煮粥食用，富含膳食纤维。",
    'nursing-home': "推荐'康乐老年公寓'，环境优美，提供专业护理服务。"
  };
  
  const typeReplies = replies[type] || replies.chat;
  return Array.isArray(typeReplies) 
    ? typeReplies[Math.floor(Math.random() * typeReplies.length)]
    : typeReplies;
}