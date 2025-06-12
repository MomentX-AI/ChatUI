<template>
  <div class="chat-app">
    <!-- Sidebar -->
    <Sidebar
      :sessions="sessions"
      :current-session-id="currentSessionId"
      @create-session="createNewSession"
      @switch-session="switchSession"
      @delete-session="deleteSession"
      @update-session-title="updateSessionTitle"
    />
    
    <!-- Main Chat Area -->
    <div class="chat-container">
      <!-- Header -->
      <div class="chat-header">
        <div class="header-content">
          <h1 class="chat-title">
            <span class="title-icon">🤖</span>
            AI 聊天助手
          </h1>
          <div class="header-actions">
            <button @click="showSettings = !showSettings" class="settings-btn" title="設定">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
            <button @click="clearChat" class="clear-btn" title="清除對話">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Settings Panel -->
      <div v-if="showSettings" class="settings-panel">
        <div class="settings-content">
          <h3>聊天設定</h3>
          <div class="setting-group">
            <label>API 網址:</label>
            <input v-model="config.apiUrl" type="text" class="setting-input" />
          </div>
          <div class="setting-group">
            <label>模型:</label>
            <input v-model="config.model" type="text" class="setting-input" />
          </div>
          <div class="setting-group">
            <label>溫度 (0-1):</label>
            <input v-model.number="config.temperature" type="number" min="0" max="1" step="0.1" class="setting-input" />
          </div>
          <div class="setting-group">
            <label>系統訊息:</label>
            <textarea v-model="config.systemMessage" class="setting-textarea"></textarea>
          </div>
          <button @click="showSettings = false" class="settings-close-btn">關閉設定</button>
        </div>
      </div>

              <!-- Messages Area -->
        <div class="messages-container" ref="messagesContainer">
          <div v-if="currentMessages.length === 0" class="welcome-message">
          <div class="welcome-content">
            <div class="welcome-icon">👋</div>
            <h2>歡迎使用 AI 聊天助手</h2>
            <p>請輸入您的問題，我會盡力為您解答！</p>
            <div class="example-questions">
              <button @click="sendExampleMessage('你好，請介紹一下自己')" class="example-btn">
                你好，請介紹一下自己
              </button>
              <button @click="sendExampleMessage('你能做什麼？')" class="example-btn">
                你能做什麼？
              </button>
              <button @click="sendExampleMessage('告訴我一個有趣的事實')" class="example-btn">
                告訴我一個有趣的事實
              </button>
            </div>
          </div>
        </div>

                  <div v-else class="messages-list">
            <ChatMessage
              v-for="message in currentMessages"
              :key="message.id"
              :message="message"
            />
          </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          <div class="error-content">
            <span class="error-icon">⚠️</span>
            <span>{{ error }}</span>
            <button @click="error = null" class="error-close">×</button>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <ChatInput
        :is-loading="isLoading"
        @send-message="sendMessage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import Sidebar from './components/Sidebar.vue'
import ChatMessage from './components/ChatMessage.vue'
import ChatInput from './components/ChatInput.vue'
import { useChat } from './composables/useChat.js'

// Chat functionality
const { 
  sessions,
  currentSessionId,
  currentSession,
  currentMessages,
  createNewSession,
  switchSession,
  deleteSession,
  updateSessionTitle,
  isLoading, 
  error, 
  config, 
  sendMessage, 
  clearChat, 
  updateConfig 
} = useChat()

// UI state
const showSettings = ref(false)
const messagesContainer = ref(null)

// Auto scroll to bottom when new messages arrive
watch(currentMessages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}, { deep: true })

// Watch config changes and update
watch(config, (newConfig) => {
  updateConfig(newConfig)
}, { deep: true })

// Example message handler
const sendExampleMessage = (message) => {
  sendMessage(message)
}
</script>

<style scoped>
.chat-app {
  width: 100%;
  height: 100vh;
  display: flex;
  margin: 0 auto;
}

.chat-container {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-header {
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.title-icon {
  font-size: 28px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.settings-btn,
.clear-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.05);
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.settings-btn:hover,
.clear-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

.settings-panel {
  background: #f8f9fa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 20px 24px;
}

.settings-content h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.setting-group {
  margin-bottom: 12px;
}

.setting-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.setting-input,
.setting-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.setting-textarea {
  resize: vertical;
  min-height: 60px;
}

.settings-close-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.settings-close-btn:hover {
  background: #1976d2;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.welcome-message {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.welcome-content {
  max-width: 400px;
}

.welcome-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.welcome-content h2 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.welcome-content p {
  color: #666;
  font-size: 16px;
  margin-bottom: 30px;
  line-height: 1.5;
}

.example-questions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.example-btn {
  padding: 12px 20px;
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.2);
  border-radius: 12px;
  color: #2196f3;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.example-btn:hover {
  background: rgba(33, 150, 243, 0.15);
  transform: translateY(-1px);
}

.messages-list {
  display: flex;
  flex-direction: column;
}

.error-message {
  margin: 16px 0;
}

.error-content {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c62828;
}

.error-icon {
  font-size: 16px;
}

.error-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 18px;
  color: #c62828;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .chat-app {
    flex-direction: column;
  }
  
  .chat-title {
    font-size: 20px;
  }
  
  .welcome-content h2 {
    font-size: 24px;
  }
  
  .example-questions {
    gap: 6px;
  }
  
  .example-btn {
    padding: 10px 16px;
    font-size: 13px;
  }
}
</style> 