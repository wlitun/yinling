const axios = require('axios');

// 通义千问API配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
if (!DASHSCOPE_API_KEY) {
  return res.status(500).json({ error: 'API密钥未配置' });
}
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

module.exports = async (req, res) => {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { message, type = 'chat' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // 根据类型设置不同的系统提示
    let systemPrompt = '';
    switch(type) {
      case 'recipe':
        systemPrompt = `你是一位专业的老年营养师，请根据用户提供的健康状况和饮食偏好，生成适合的健康食谱。
        请以以下格式回复：
        食谱名称：[具体的食谱名称]
        适用人群：[适合的健康状况]
        主要食材：[列出主要食材]
        制作步骤：[详细的步骤说明]
        营养特点：[说明食谱的营养价值]
        注意事项：[相关的饮食注意事项]`;
        break;
      case 'nursing-home':
        systemPrompt = `你是一位专业的养老顾问，请根据用户的需求推荐合适的养老院。
        请以以下格式回复：
        推荐机构：[养老院名称]
        所在地区：[具体位置]
        适合预算：[价格范围]
        服务特色：[主要服务内容]
        推荐理由：[为什么适合用户]
        联系方式：[如果有的话]`;
        break;
      default:
        systemPrompt = `你是一位专门为老年人提供陪伴和关怀的AI助手。请用温暖、耐心、富有同理心的语气与老年人交流。
        说话要简洁明了，避免使用复杂词汇。专注于提供情感支持和简单的生活建议。
        如果老人提到孤独、健康问题或生活困难，要给予温暖的安慰和实用的建议。`;
    }
    
    // 调用通义千问API
    const response = await axios.post(DASHSCOPE_API_URL, {
      model: 'qwen-turbo', // 或 qwen-plus, qwen-max
      input: {
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ]
      },
      parameters: {
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 1500
      }
    }, {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
        //'X-DashScope-Async': 'enable' // 如果需要异步调用
      }
    });
    
    const aiReply = response.data.output.choices[0].message.content;
    
    res.status(200).json({ 
      success: true, 
      reply: aiReply,
      type: type
    });
    
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    
    // 备用回复（当API不可用时使用）
    const fallbackReplies = {
      chat: [
        "老人家，今天天气不错，适合出去散散步呢。",
        "我理解您的感受，很多人都有类似的经历。",
        "保持积极心态对健康很重要，您平时有什么兴趣爱好？"
      ],
      recipe: [
        "根据您的需求，我推荐燕麦蔬菜粥：燕麦片50g，胡萝卜半根，青菜适量，香菇2朵。先将燕麦煮软，再加入切好的蔬菜煮熟，最后加少量盐调味。这道粥富含膳食纤维，容易消化。",
        "为您推荐清蒸鲈鱼：新鲜鲈鱼一条，姜片、葱段适量。鱼洗净后放上姜葱，水开后蒸8-10分钟，淋上少量生抽即可。高蛋白低脂肪，适合老年人食用。"
      ],
      'nursing-home': [
        "根据您的需求，推荐'康乐老年公寓'，位于市中心，交通便利，月费约4500元起，提供24小时护理和营养餐食。",
        "'幸福家园养老院'可能适合您，位于郊区环境优美，月费3800元起，有专业的医疗团队和丰富的文娱活动。"
      ]
    };
    
    const randomReply = fallbackReplies[type]?.[Math.floor(Math.random() * fallbackReplies[type].length)] || "抱歉，我现在无法回复您，请稍后再试。";
    
    res.status(200).json({ 
      success: true, 
      reply: randomReply,
      note: "当前使用备用回复，配置API密钥后可体验真实AI对话"
    });
  }

};
