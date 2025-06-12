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
        <span v-if="message.editedAt" class="edit-indicator" title="已編輯">✏️</span>
        
        <!-- Action buttons -->
        <div class="message-actions">
          <!-- Edit button -->
          <button 
            class="action-btn edit-btn"
            @click="toggleEdit"
            :disabled="isLoading"
            title="編輯訊息"
          >
            <span class="action-icon">✏️</span>
          </button>
          
          <!-- Delete button -->
          <button 
            class="action-btn delete-btn"
            @click="$emit('delete')"
            :disabled="isLoading"
            title="刪除訊息"
          >
            <span class="action-icon">🗑️</span>
          </button>
          
          <!-- Regenerate button for assistant messages -->
          <button 
            v-if="message.role === 'assistant' && message.content.trim() && canRegenerate" 
            class="action-btn regenerate-btn"
            @click="$emit('regenerate')"
            :disabled="isLoading"
            title="重新生成回覆"
          >
            <span class="regenerate-icon">🔄</span>
            <span class="regenerate-text">重新生成</span>
          </button>
        </div>
      </div>
      
      <!-- Edit mode -->
      <div v-if="isEditing" class="edit-mode">
        <textarea 
          v-model="editContent"
          class="edit-textarea"
          @keydown.ctrl.enter="saveEdit"
          @keydown.esc="cancelEdit"
          ref="editTextarea"
        ></textarea>
        <div class="edit-actions">
          <button 
            class="save-btn"
            @click="saveEdit"
            :disabled="!editContent.trim()"
          >
            ✅ 保存
          </button>
          <button 
            class="cancel-btn"
            @click="cancelEdit"
          >
            ❌ 取消
          </button>
        </div>
      </div>
      
      <!-- Display mode -->
      <div v-else class="message-text" v-html="formatMessage(message.content)"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref, nextTick } from 'vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  canRegenerate: {
    type: Boolean,
    default: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['regenerate', 'delete', 'edit'])

// 編輯狀態
const isEditing = ref(false)
const editContent = ref('')
const editTextarea = ref(null)

// 切換編輯模式
const toggleEdit = async () => {
  isEditing.value = !isEditing.value
  if (isEditing.value) {
    editContent.value = props.message.content
    await nextTick()
    if (editTextarea.value) {
      editTextarea.value.focus()
      editTextarea.value.style.height = 'auto'
      editTextarea.value.style.height = editTextarea.value.scrollHeight + 'px'
    }
  }
}

// 保存編輯
const saveEdit = () => {
  if (editContent.value.trim() && editContent.value !== props.message.content) {
    emit('edit', props.message.id, editContent.value.trim())
  }
  isEditing.value = false
}

// 取消編輯
const cancelEdit = () => {
  isEditing.value = false
  editContent.value = props.message.content
}

// 監控訊息內容變化
watch(() => props.message.content, (newContent, oldContent) => {
  if (props.message.role === 'assistant') {
    console.log('ChatMessage: Content updated', {
      id: props.message.id,
      oldLength: oldContent?.length || 0,
      newLength: newContent?.length || 0,
      content: newContent?.substring(0, 50) + (newContent?.length > 50 ? '...' : '')
    })
  }
}, { immediate: true })

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

.edit-indicator {
  font-size: 12px;
  color: #666;
  margin-left: 8px;
}

.message-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  font-size: 11px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  min-width: 28px;
  justify-content: center;
}

.action-btn:hover:not(:disabled) {
  background: #e0e0e0;
  border-color: #ccc;
  color: #333;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  font-size: 12px;
}

.regenerate-btn {
  min-width: auto;
  padding: 4px 8px;
}

.regenerate-icon {
  font-size: 12px;
  animation: none;
}

.regenerate-btn:disabled .regenerate-icon {
  animation: spin 1s linear infinite;
}

.regenerate-text {
  font-weight: 500;
}

.edit-mode {
  margin-top: 8px;
}

.edit-textarea {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  background: #fff;
  color: #333;
}

.edit-textarea:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}

.save-btn,
.cancel-btn {
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
}

.save-btn {
  color: #4caf50;
  border-color: #4caf50;
}

.save-btn:hover:not(:disabled) {
  background: #4caf50;
  color: white;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  color: #f44336;
  border-color: #f44336;
}

.cancel-btn:hover {
  background: #f44336;
  color: white;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style> 