// 页面导航
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initChat();
    initRecipes();
    initNursingHomes();
});

function initNavigation() {
    document.querySelectorAll('.nav-link, .feature-card, button[data-page]').forEach(element => {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            switchPage(targetPage);
        });
    });
}

function switchPage(targetPage) {
    // 更新导航
    document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
    document.querySelector(`.nav-link[data-page="${targetPage}"]`)?.classList.add('active');
    
    // 显示对应页面
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
        if (section.id === targetPage) section.classList.add('active');
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// AI聊天功能
function initChat() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');
    
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;
        
        addMessage(message, 'user');
        messageInput.value = '';
        
        const loadingId = showLoading();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, type: 'chat' })
            });
            
            const data = await response.json();
            removeLoading(loadingId);
            addMessage(data.reply, 'ai');
            
            // 语音朗读
            if (document.getElementById('voiceSwitch')?.checked) {
                speakText(data.reply);
            }
        } catch (error) {
            removeLoading(loadingId);
            addMessage('抱歉，服务暂时不可用', 'ai');
        }
    }
    
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', e => e.key === 'Enter' && sendMessage());
}

// 食谱功能
function initRecipes() {
    document.getElementById('generateRecipe')?.addEventListener('click', async function() {
        const health = document.getElementById('healthCondition').value;
        const diet = document.getElementById('dietPreference').value;
        const prompt = `健康状况：${health}，饮食偏好：${diet}。请推荐适合的健康食谱。`;
        
        showRecipeLoading();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: prompt, type: 'recipe' })
            });
            
            const data = await response.json();
            displayRecipeResult(data.reply);
        } catch (error) {
            displayRecipeResult('无法生成食谱，请稍后重试。');
        }
    });
}

// 养老院功能
function initNursingHomes() {
    document.getElementById('searchNursingHome')?.addEventListener('click', async function() {
        const location = document.getElementById('location').value;
        const budget = document.getElementById('budget').value;
        const careLevel = document.getElementById('careLevel').value;
        const prompt = `地区：${location}，预算：${budget}，护理等级：${careLevel}。请推荐合适的养老院。`;
        
        showNursingHomeLoading();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: prompt, type: 'nursing-home' })
            });
            
            const data = await response.json();
            displayNursingHomeResult(data.reply);
        } catch (error) {
            displayNursingHomeResult('无法获取推荐，请稍后重试。');
        }
    });
}

// 通用工具函数
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    document.getElementById('chatMessages').appendChild(messageDiv);
    document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
}

function showLoading() {
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message ai-message';
    div.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 思考中...';
    document.getElementById('chatMessages').appendChild(div);
    return id;
}

function removeLoading(id) {
    document.getElementById(id)?.remove();
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
    }
}

function showRecipeLoading() {
    document.getElementById('recipeResults').innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">AI正在为您生成个性化食谱...</p>
        </div>
    `;
}

function displayRecipeResult(text) {
    document.getElementById('recipeResults').innerHTML = `
        <div class="col-12">
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h4>AI为您定制的健康食谱</h4>
                </div>
                <div class="card-body">
                    <div class="ai-response">${formatText(text)}</div>
                </div>
            </div>
        </div>
    `;
}

function showNursingHomeLoading() {
    document.getElementById('nursingHomeResults').innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">AI正在为您推荐合适的养老院...</p>
        </div>
    `;
}

function displayNursingHomeResult(text) {
    document.getElementById('nursingHomeResults').innerHTML = `
        <div class="col-12">
            <div class="card">
                <div class="card-header bg-success text-white">
                    <h4>AI为您推荐的养老机构</h4>
                </div>
                <div class="card-body">
                    <div class="ai-response">${formatText(text)}</div>
                </div>
            </div>
        </div>
    `;
}

function formatText(text) {
    return text.replace(/\n/g, '<br>')
               .replace(/(食谱名称|适用人群|主要食材|制作步骤|营养特点|注意事项|推荐机构|所在地区|适合预算|服务特色|推荐理由|联系方式)：/g, '<strong>$1：</strong>');
}