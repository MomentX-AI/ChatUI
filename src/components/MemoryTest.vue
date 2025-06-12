<template>
  <div class="memory-test">
    <div class="test-header">
      <h3>🧠 記憶功能測試</h3>
      <button @click="isExpanded = !isExpanded" class="toggle-btn">
        {{ isExpanded ? '收起' : '展開' }}
      </button>
    </div>
    
    <div v-if="isExpanded" class="test-content">
      <p class="test-description">
        點擊下方按鈕來測試 AI 的對話記憶功能。建議按順序執行測試：
      </p>
      
      <div class="test-steps">
        <div class="test-step">
          <h4>步驟 1: 建立基本信息</h4>
          <div class="test-buttons">
            <button @click="sendTest('我的名字是張小明，我今年 28 歲')" class="test-btn">
              設定姓名和年齡
            </button>
            <button @click="sendTest('我是一名軟體工程師，喜歡喝咖啡和閱讀科技書籍')" class="test-btn">
              設定職業和愛好
            </button>
            <button @click="sendTest('我住在台北，最喜歡的運動是籃球')" class="test-btn">
              設定居住地和運動
            </button>
          </div>
        </div>
        
        <div class="test-step">
          <h4>步驟 2: 測試記憶回溯</h4>
          <div class="test-buttons">
            <button @click="sendTest('你還記得我的名字嗎？')" class="test-btn">
              測試姓名記憶
            </button>
            <button @click="sendTest('我的職業是什麼？')" class="test-btn">
              測試職業記憶
            </button>
            <button @click="sendTest('我喜歡什麼運動？')" class="test-btn">
              測試運動偏好
            </button>
            <button @click="sendTest('能幫我總結一下你知道關於我的所有信息嗎？')" class="test-btn">
              測試綜合記憶
            </button>
          </div>
        </div>
        
        <div class="test-step">
          <h4>步驟 3: 測試上下文理解</h4>
          <div class="test-buttons">
            <button @click="sendTest('基於我的職業背景，推薦一些適合的書籍')" class="test-btn">
              上下文推薦
            </button>
            <button @click="sendTest('考慮到我的居住地，這個週末有什麼活動建議？')" class="test-btn">
              地理上下文
            </button>
            <button @click="sendTest('根據我們之前的對話，你覺得我是什麼樣的人？')" class="test-btn">
              個性分析
            </button>
          </div>
        </div>
        
        <div class="test-step">
          <h4>步驟 4: 長對話測試</h4>
          <div class="test-buttons">
            <button @click="fillConversation" class="test-btn special">
              🚀 自動填充長對話 (測試記憶管理)
            </button>
          </div>
          <p class="test-note">
            這會自動發送多條訊息來測試記憶管理和摘要功能
          </p>
        </div>
      </div>
      
      <div class="memory-status">
        <h4>當前記憶狀態</h4>
        <div v-if="contextInfo" class="status-info">
          <div class="status-row">
            <span>訊息數量:</span>
            <span>{{ contextInfo.messageCount }}</span>
          </div>
          <div class="status-row">
            <span>預估 Tokens:</span>
            <span>{{ contextInfo.estimatedTokens }}</span>
          </div>
          <div class="status-row">
            <span>管理狀態:</span>
            <span :class="{ active: contextInfo.needsManagement }">
              {{ contextInfo.needsManagement ? '已啟用' : '正常' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  contextInfo: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['send-message'])

const isExpanded = ref(false)

const sendTest = (message) => {
  emit('send-message', message)
}

const fillConversation = async () => {
  const messages = [
    '請告訴我人工智能的發展歷史',
    '機器學習和深度學習的區別是什麼？',
    '什麼是神經網絡？',
    '自然語言處理有哪些技術？',
    '計算機視覺的應用？',
    '強化學習是什麼？',
    '大語言模型怎麼訓練？',
    'AI 倫理議題？',
    '量子計算對 AI 的影響？',
    'Transformer 架構？',
    '你記得我剛才說的基本信息嗎？',
    '我的名字、年齡、職業都是什麼？'
  ]
  
  for (let i = 0; i < messages.length; i++) {
    setTimeout(() => {
      sendTest(messages[i])
    }, i * 2500) // 每2.5秒發送一條訊息，更快觸發摘要
  }
}
</script>

<style scoped>
.memory-test {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
}

.test-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.test-header h3 {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
}

.toggle-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  padding: 4px 12px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.test-content {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.test-description {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.test-step {
  margin-bottom: 24px;
}

.test-step h4 {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.test-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.test-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 140px;
}

.test-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.test-btn.special {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  font-weight: 600;
}

.test-note {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  margin-top: 8px;
  font-style: italic;
}

.memory-status {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.memory-status h4 {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin: 0 0 12px 0;
}

.status-info {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  padding: 12px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
}

.status-row span:first-child {
  color: rgba(255, 255, 255, 0.7);
}

.status-row span:last-child {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.status-row span.active {
  color: #fbbf24;
}

@media (max-width: 768px) {
  .test-buttons {
    flex-direction: column;
  }
  
  .test-btn {
    min-width: auto;
    flex: none;
  }
}
</style> 