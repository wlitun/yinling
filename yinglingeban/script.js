// 页面导航功能
document.addEventListener('DOMContentLoaded', function() {
    // 导航切换
    const navLinks = document.querySelectorAll('.nav-link');
    const pageSections = document.querySelectorAll('.page-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 更新导航激活状态
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应页面
            const targetPage = this.getAttribute('data-page');
            pageSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetPage) {
                    section.classList.add('active');
                }
            });
            
            // 滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // 特殊页面初始化
            if (targetPage === 'recipe') {
                generateSampleRecipes();
            } else if (targetPage === 'nursing-home') {
                generateSampleNursingHomes();
            }
        });
    });
    
    // 首页卡片点击功能
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            
            // 更新导航激活状态
            navLinks.forEach(nav => nav.classList.remove('active'));
            document.querySelector(`.nav-link[data-page="${targetPage}"]`).classList.add('active');
            
            // 显示对应页面
            pageSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetPage) {
                    section.classList.add('active');
                }
            });
            
            // 滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // 特殊页面初始化
            if (targetPage === 'recipe') {
                generateSampleRecipes();
            } else if (targetPage === 'nursing-home') {
                generateSampleNursingHomes();
            }
        });
    });
    
    // 首页按钮导航
    document.querySelectorAll('button[data-page]').forEach(button => {
        button.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            document.querySelector(`.nav-link[data-page="${targetPage}"]`).click();
        });
    });
    
    // AI聊天功能
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');
    const voiceSwitch = document.getElementById('voiceSwitch');
    
    // 添加消息到聊天窗口
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        messageDiv.textContent = text;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 发送消息到真实AI
    async function sendRealMessage(message) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message
          })
        });
        
        if (!response.ok) {
          throw new Error('网络请求失败');
        }
        
        const data = await response.json();
        
        if (data.success) {
          return data.reply;
        } else {
          throw new Error(data.error || '未知错误');
        }
        
      } catch (error) {
        console.error('发送消息失败:', error);
        return "抱歉，我现在无法回复您。请检查网络连接或稍后再试。";
      }
    }
    
    // 添加加载消息功能
    function showLoadingMessage() {
      const loadingId = 'loading-' + Date.now();
      const loadingMessage = document.createElement('div');
      loadingMessage.id = loadingId;
      loadingMessage.classList.add('message', 'ai-message');
      loadingMessage.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 思考中...';
      chatMessages.appendChild(loadingMessage);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return loadingId;
    }
    
    function removeLoadingMessage(loadingId) {
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) {
        loadingElement.remove();
      }
    }
    
    // 发送消息功能（统一版本）
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (message === '') return;
        
        // 添加用户消息
        addMessage(message, 'user');
        messageInput.value = '';
        
        // 显示加载状态
        const loadingId = showLoadingMessage();
        
        // 调用真实API
        const aiReply = await sendRealMessage(message);
        
        // 移除加载消息
        removeLoadingMessage(loadingId);
        
        // 添加AI回复
        addMessage(aiReply, 'ai');
        
        // 如果语音朗读开启，朗读AI回复
        if (voiceSwitch.checked) {
            speakText(aiReply);
        }
    }
    
    // 发送消息事件
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 语音朗读功能
    function speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.9; // 稍慢的语速，适合老年人
            speechSynthesis.speak(utterance);
        }
    }
    
    // 语音输入功能
    const voiceBtn = document.getElementById('voiceBtn');
    const voiceStatus = document.getElementById('voiceStatus');
    
    let recognition;
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'zh-CN';
        
        recognition.onstart = function() {
            voiceBtn.classList.add('listening');
            voiceStatus.textContent = '正在聆听...';
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            messageInput.value = transcript;
            voiceStatus.textContent = '已识别: ' + transcript;
            voiceBtn.classList.remove('listening');
        };
        
        recognition.onerror = function() {
            voiceStatus.textContent = '语音识别错误，请重试';
            voiceBtn.classList.remove('listening');
        };
        
        recognition.onend = function() {
            voiceBtn.classList.remove('listening');
            voiceStatus.textContent = '点击麦克风开始语音输入';
        };
        
        voiceBtn.addEventListener('click', function() {
            if (voiceBtn.classList.contains('listening')) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else {
        voiceStatus.textContent = '您的浏览器不支持语音识别';
        voiceBtn.style.opacity = '0.5';
        voiceBtn.style.cursor = 'not-allowed';
    }
    
    // 食谱生成功能
    const generateRecipeBtn = document.getElementById('generateRecipe');
    const recipeResults = document.getElementById('recipeResults');
    
    // 示例食谱数据
    const sampleRecipes = [
        {
            name: "燕麦蔬菜粥",
            image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
            description: "富含膳食纤维，易于消化，适合早餐食用。",
            ingredients: ["燕麦片", "胡萝卜", "青菜", "香菇", "少量盐"],
            healthBenefits: "降血压、促进消化"
        },
        {
            name: "清蒸鲈鱼",
            image: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
            description: "高蛋白低脂肪，富含不饱和脂肪酸，有益心血管健康。",
            ingredients: ["新鲜鲈鱼", "姜片", "葱段", "少量生抽"],
            healthBenefits: "保护心脏、补充优质蛋白"
        },
        {
            name: "豆腐蔬菜汤",
            image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
            description: "清淡易消化，富含植物蛋白和多种维生素。",
            ingredients: ["嫩豆腐", "西红柿", "菠菜", "金针菇", "少量盐"],
            healthBenefits: "补钙、增强免疫力"
        }
    ];
    
    // 生成示例食谱
    function generateSampleRecipes() {
        recipeResults.innerHTML = '';
        
        sampleRecipes.forEach(recipe => {
            const recipeCol = document.createElement('div');
            recipeCol.className = 'col-md-4';
            
            recipeCol.innerHTML = `
                <div class="recipe-card">
                    <div class="recipe-image" style="background-image: url('${recipe.image}')"></div>
                    <div class="recipe-content">
                        <h4>${recipe.name}</h4>
                        <p>${recipe.description}</p>
                        <h6>主要食材:</h6>
                        <p>${recipe.ingredients.join('、')}</p>
                        <h6>健康益处:</h6>
                        <p>${recipe.healthBenefits}</p>
                        <button class="btn btn-sm btn-outline-primary">查看详细做法</button>
                    </div>
                </div>
            `;
            
            recipeResults.appendChild(recipeCol);
        });
    }
    
    // 食谱生成按钮事件
    generateRecipeBtn.addEventListener('click', generateSampleRecipes);
    
    // 养老院推荐功能
    const searchNursingHomeBtn = document.getElementById('searchNursingHome');
    const nursingHomeResults = document.getElementById('nursingHomeResults');
    
    // 示例养老院数据
    const sampleNursingHomes = [
        {
            name: "康乐老年公寓",
            location: "北京市朝阳区",
            price: "4500元/月起",
            rating: 4,
            features: ["24小时护理", "医疗团队", "营养餐食", "文娱活动"],
            description: "位于市区，交通便利，环境优雅，专业护理团队。"
        },
        {
            name: "幸福家园养老院",
            location: "上海市浦东新区",
            price: "5200元/月起",
            rating: 5,
            features: ["康复训练", "心理疏导", "户外花园", "家属探视方便"],
            description: "现代化设施，专业康复服务，注重老年人心理健康。"
        },
        {
            name: "安康养老中心",
            location: "广州市天河区",
            price: "3800元/月起",
            rating: 4,
            features: ["中医养生", "理疗服务", "文化活动", "交通便利"],
            description: "结合传统中医养生理念，提供全面的健康管理服务。"
        }
    ];
    
    // 生成示例养老院
    function generateSampleNursingHomes() {
        nursingHomeResults.innerHTML = '';
        
        sampleNursingHomes.forEach(home => {
            const homeCol = document.createElement('div');
            homeCol.className = 'col-md-6';
            
            // 生成星级评分
            let stars = '';
            for (let i = 0; i < 5; i++) {
                stars += i < home.rating ? 
                    '<i class="fas fa-star rating"></i>' : 
                    '<i class="far fa-star"></i>';
            }
            
            homeCol.innerHTML = `
                <div class="nursing-home-card">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h4>${home.name}</h4>
                        <div>${stars}</div>
                    </div>
                    <p><i class="fas fa-map-marker-alt me-2"></i> ${home.location}</p>
                    <p><i class="fas fa-tag me-2"></i> ${home.price}</p>
                    <p>${home.description}</p>
                    <div class="mb-3">
                        ${home.features.map(feature => 
                            `<span class="badge bg-light text-dark me-1">${feature}</span>`
                        ).join('')}
                    </div>
                    <div class="d-grid gap-2 d-md-flex">
                        <button class="btn btn-primary me-md-2">查看详情</button>
                        <button class="btn btn-outline-primary">联系咨询</button>
                    </div>
                </div>
            `;
            
            nursingHomeResults.appendChild(homeCol);
        });
    }
    
    // 养老院搜索按钮事件
    searchNursingHomeBtn.addEventListener('click', generateSampleNursingHomes);
    
    // 初始化显示一些内容
    generateSampleRecipes();
    generateSampleNursingHomes();
});


// 统一的AI请求函数
async function sendAIRequest(message, type = 'chat') {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                type: type
            })
        });
        
        if (!response.ok) {
            throw new Error('网络请求失败');
        }
        
        const data = await response.json();
        return data.reply;
        
    } catch (error) {
        console.error('AI请求失败:', error);
        throw new Error('服务暂时不可用，请稍后再试');
    }
}

// 修改聊天功能
async function sendMessage() {
    const message = messageInput.value.trim();
    if (message === '') return;
    
    // 添加用户消息
    addMessage(message, 'user');
    messageInput.value = '';
    
    // 显示加载状态
    const loadingId = showLoadingMessage();
    
    try {
        // 调用真实AI
        const aiReply = await sendAIRequest(message, 'chat');
        
        // 移除加载消息
        removeLoadingMessage(loadingId);
        
        // 添加AI回复
        addMessage(aiReply, 'ai');
        
        // 如果语音朗读开启，朗读AI回复
        if (voiceSwitch.checked) {
            speakText(aiReply);
        }
    } catch (error) {
        removeLoadingMessage(loadingId);
        addMessage(error.message, 'ai');
    }
}

// 修改食谱生成功能
async function generateRealRecipes() {
    const healthCondition = document.getElementById('healthCondition').value;
    const dietPreference = document.getElementById('dietPreference').value;
    
    const prompt = `健康状况：${healthCondition}，饮食偏好：${dietPreference}。请为我推荐适合的健康食谱。`;
    
    recipeResults.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <p class="mt-2">AI正在为您生成个性化食谱...</p>
        </div>
    `;
    
    try {
        const aiReply = await sendAIRequest(prompt, 'recipe');
        displayRecipeResult(aiReply);
    } catch (error) {
        recipeResults.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">${error.message}</div>
            </div>
        `;
    }
}

// 显示AI生成的食谱结果
function displayRecipeResult(aiReply) {
    recipeResults.innerHTML = `
        <div class="col-12">
            <div class="card recipe-card">
                <div class="card-header recipe-header bg-primary text-white">
                    <h4 class="mb-0">AI为您定制的健康食谱</h4>
                </div>
                <div class="card-body">
                    <div class="recipe-content">
                        ${formatAIResponse(aiReply)}
                    </div>
                    <button class="btn btn-primary mt-3" onclick="generateRealRecipes()">重新生成</button>
                </div>
            </div>
        </div>
    `;
}

// 修改养老院推荐功能
async function searchRealNursingHomes() {
    const location = document.getElementById('location').value;
    const budget = document.getElementById('budget').value;
    const careLevel = document.getElementById('careLevel').value;
    
    const prompt = `地区：${location}，预算：${budget}，护理等级：${careLevel}。请推荐合适的养老院。`;
    
    nursingHomeResults.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <p class="mt-2">AI正在为您推荐合适的养老院...</p>
        </div>
    `;
    
    try {
        const aiReply = await sendAIRequest(prompt, 'nursing-home');
        displayNursingHomeResult(aiReply);
    } catch (error) {
        nursingHomeResults.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">${error.message}</div>
            </div>
        `;
    }
}

// 显示AI推荐的养老院结果
function displayNursingHomeResult(aiReply) {
    nursingHomeResults.innerHTML = `
        <div class="col-12">
            <div class="card">
                <div class="card-header bg-success text-white">
                    <h4 class="mb-0">AI为您推荐的养老机构</h4>
                </div>
                <div class="card-body">
                    <div class="nursing-home-content">
                        ${formatAIResponse(aiReply)}
                    </div>
                    <button class="btn btn-success mt-3" onclick="searchRealNursingHomes()">重新推荐</button>
                </div>
            </div>
        </div>
    `;
}

// 格式化AI回复（将文本转换为更好的HTML显示）
function formatAIResponse(text) {
    // 将换行符转换为<br>
    let formattedText = text.replace(/\n/g, '<br>');
    
    // 简单的格式增强
    formattedText = formattedText.replace(/(食谱名称|适用人群|主要食材|制作步骤|营养特点|注意事项|推荐机构|所在地区|适合预算|服务特色|推荐理由|联系方式)：/g, '<strong>$1：</strong>');
    
    return `<div class="ai-response">${formattedText}</div>`;
}

// 更新事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // ... 其他现有代码 ...
    
    // 更新食谱生成按钮事件
    const generateRecipeBtn = document.getElementById('generateRecipe');
    generateRecipeBtn.addEventListener('click', generateRealRecipes);
    
    // 更新养老院搜索按钮事件
    const searchNursingHomeBtn = document.getElementById('searchNursingHome');
    searchNursingHomeBtn.addEventListener('click', searchRealNursingHomes);
    
    // 移除原有的示例数据生成
    // generateSampleRecipes();  // 注释掉这行
    // generateSampleNursingHomes();  // 注释掉这行
});