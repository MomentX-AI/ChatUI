<template>
  <div class="chat-input">
    <div class="input-container">
      <textarea
        ref="textareaRef"
        v-model="inputMessage"
        @keydown="handleKeydown"
        @input="adjustHeight"
        placeholder="輸入您的訊息..."
        :disabled="isLoading"
        rows="1"
        class="message-input"
      ></textarea>
      <button
        @click="handleSubmit"
        :disabled="!inputMessage.trim() || isLoading"
        class="send-button"
      >
        <span v-if="!isLoading">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22,2 15,22 11,13 2,9"></polygon>
          </svg>
        </span>
        <div v-else class="loading-dots">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['send-message'])

const inputMessage = ref('')
const textareaRef = ref(null)

const handleSubmit = () => {
  if (inputMessage.value.trim() && !props.isLoading) {
    emit('send-message', inputMessage.value.trim())
    inputMessage.value = ''
    resetHeight()
  }
}

const handleKeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSubmit()
  }
}

const adjustHeight = () => {
  nextTick(() => {
    const textarea = textareaRef.value
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  })
}

const resetHeight = () => {
  nextTick(() => {
    const textarea = textareaRef.value
    if (textarea) {
      textarea.style.height = 'auto'
    }
  })
}
</script>

<style scoped>
.chat-input {
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  max-width: 100%;
}

.message-input {
  flex: 1;
  min-height: 44px;
  max-height: 120px;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 22px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

.message-input:focus {
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.message-input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.message-input::placeholder {
  color: #999;
}

.send-button {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: #2196f3;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  background: #1976d2;
  transform: scale(1.05);
}

.send-button:active:not(:disabled) {
  transform: scale(0.95);
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.loading-dots {
  display: flex;
  gap: 2px;
}

.loading-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: currentColor;
}
</style> 