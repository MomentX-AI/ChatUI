<template>
  <div class="message" :class="{ 'user-message': message.role === 'user', 'assistant-message': message.role === 'assistant' }">
    <div class="message-avatar">
      <div class="avatar" :class="message.role">
        {{ message.role === 'user' ? '👤' : '🤖' }}
      </div>
    </div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-role">{{ message.role === 'user' ? '你' : 'AI 助手' }}</span>
        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
      </div>
      <div class="message-text" v-html="formatMessage(message.content)"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMessage = (content) => {
  if (!content) return ''
  // Simple formatting for better readability
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
}
</script>

<style scoped>
.message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 12px;
  max-width: 100%;
}

.user-message {
  background: #e3f2fd;
  margin-left: 20px;
  flex-direction: row-reverse;
}

.assistant-message {
  background: #f5f5f5;
  margin-right: 20px;
}

.message-avatar {
  flex-shrink: 0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
}

.avatar.user {
  background: #2196f3;
  color: white;
}

.avatar.assistant {
  background: #4caf50;
  color: white;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.user-message .message-content {
  text-align: right;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
}

.user-message .message-header {
  justify-content: flex-end;
}

.message-role {
  font-weight: 500;
  color: #333;
}

.message-text {
  line-height: 1.6;
  color: #333;
  word-wrap: break-word;
}

.message-text :deep(code) {
  background: #f0f0f0;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.9em;
}

.message-text :deep(strong) {
  font-weight: 600;
}

.message-text :deep(em) {
  font-style: italic;
}
</style> 