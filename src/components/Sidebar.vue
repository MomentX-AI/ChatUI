<template>
  <div class="sidebar" :class="{ 'sidebar-collapsed': !isExpanded }">
    <!-- Sidebar Header -->
    <div class="sidebar-header">
      <button @click="toggleSidebar" class="sidebar-toggle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      
      <div v-if="isExpanded" class="sidebar-title">
        <span class="title-text">對話記錄</span>
        <button @click="createNewSession" class="new-chat-btn" title="新對話">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Session List -->
    <div v-if="isExpanded" class="session-list">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="session-item"
        :class="{ 'session-active': session.id === currentSessionId }"
        @click="switchSession(session.id)"
      >
        <div class="session-content">
          <div class="session-title">
            <span v-if="!session.isEditing">{{ session.title }}</span>
            <input
              v-else
              v-model="editingTitle"
              @blur="finishEditing(session.id)"
              @keydown.enter="finishEditing(session.id)"
              @keydown.esc="cancelEditing(session.id)"
              class="title-input"
              ref="titleInput"
            />
          </div>
          <div class="session-meta">
            <span class="session-time">{{ formatTime(session.updatedAt) }}</span>
            <span class="session-count">{{ session.messages.length }} 則訊息</span>
          </div>
        </div>
        
        <div class="session-actions">
          <button
            @click.stop="startEditing(session)"
            class="action-btn"
            title="重新命名"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </button>
          <button
            @click.stop="deleteSession(session.id)"
            class="action-btn delete-btn"
            title="刪除對話"
            v-if="sessions.length > 1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Sidebar Footer -->
    <div v-if="isExpanded" class="sidebar-footer">
      <div class="storage-info">
        <span class="storage-text">{{ sessions.length }} 個對話已保存</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  sessions: {
    type: Array,
    required: true
  },
  currentSessionId: {
    type: String,
    required: true
  }
})

const emit = defineEmits([
  'create-session',
  'switch-session', 
  'delete-session',
  'update-session-title'
])

const isExpanded = ref(true)
const editingTitle = ref('')
const titleInput = ref(null)

const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value
}

const createNewSession = () => {
  emit('create-session')
}

const switchSession = (sessionId) => {
  emit('switch-session', sessionId)
}

const deleteSession = (sessionId) => {
  if (confirm('確定要刪除這個對話嗎？此操作無法撤銷。')) {
    emit('delete-session', sessionId)
  }
}

const startEditing = (session) => {
  // 重置所有 session 的編輯狀態
  props.sessions.forEach(s => s.isEditing = false)
  // 設置當前 session 為編輯狀態
  session.isEditing = true
  editingTitle.value = session.title
  
  nextTick(() => {
    const input = titleInput.value?.[0] || titleInput.value
    if (input) {
      input.focus()
      input.select()
    }
  })
}

const finishEditing = (sessionId) => {
  const session = props.sessions.find(s => s.id === sessionId)
  if (session && editingTitle.value.trim()) {
    emit('update-session-title', sessionId, editingTitle.value.trim())
  }
  cancelEditing(sessionId)
}

const cancelEditing = (sessionId) => {
  const session = props.sessions.find(s => s.id === sessionId)
  if (session) {
    session.isEditing = false
  }
  editingTitle.value = ''
}

const formatTime = (isoString) => {
  const date = new Date(isoString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '今天'
  } else if (diffDays === 2) {
    return '昨天'
  } else if (diffDays <= 7) {
    return `${diffDays - 1} 天前`
  } else {
    return date.toLocaleDateString('zh-TW')
  }
}
</script>

<style scoped>
.sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: width 0.3s ease;
}

.sidebar-collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-toggle {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.sidebar-toggle:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

.sidebar-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
}

.title-text {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.new-chat-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #2196f3;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.new-chat-btn:hover {
  background: #1976d2;
  transform: scale(1.05);
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  group: hover;
}

.session-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.session-active {
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.2);
}

.session-content {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-weight: 500;
  color: #333;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
  word-break: break-word;
}

.title-input {
  width: 100%;
  border: 1px solid #2196f3;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  background: white;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.session-time {
  font-weight: 500;
}

.session-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.session-item:hover .session-actions {
  opacity: 1;
}

.session-active .session-actions {
  opacity: 1;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

.delete-btn:hover {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.02);
}

.storage-info {
  display: flex;
  align-items: center;
  justify-content: center;
}

.storage-text {
  font-size: 12px;
  color: #666;
  text-align: center;
}

@media (max-width: 768px) {
  .sidebar {
    width: 260px;
  }
  
  .sidebar-collapsed {
    width: 50px;
  }
  
  .session-title {
    font-size: 13px;
  }
  
  .session-meta {
    font-size: 11px;
  }
}
</style> 