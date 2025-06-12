import { ref, reactive, watch, computed, nextTick, triggerRef } from 'vue'

export function useSession() {
  const sessions = ref([])
  const currentSessionId = ref(null)
  const isLoading = ref(false)

  // 檢查 localStorage 是否可用
  const isLocalStorageAvailable = () => {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  // 生成唯一 ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 保存到 localStorage
  const saveToStorage = () => {
    if (!isLocalStorageAvailable()) return
    
    try {
      localStorage.setItem('chat-sessions', JSON.stringify(sessions.value))
      localStorage.setItem('current-session-id', currentSessionId.value || '')
    } catch (error) {
      console.error('Error saving sessions to storage:', error)
    }
  }

  // 創建新的 session
  const createNewSession = (title = null) => {
    const sessionId = generateId()
    const newSession = {
      id: sessionId,
      title: title || `新對話 ${sessions.value.length + 1}`,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    sessions.value.unshift(newSession)
    currentSessionId.value = sessionId
    saveToStorage()
    
    return sessionId
  }

  // 從 localStorage 加載數據
  const loadFromStorage = () => {
    if (!isLocalStorageAvailable()) {
      createNewSession()
      return
    }
    
    try {
      const savedSessions = localStorage.getItem('chat-sessions')
      const savedCurrentId = localStorage.getItem('current-session-id')
      
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions)
        if (Array.isArray(parsedSessions)) {
          sessions.value = parsedSessions
        }
      }
      
      if (savedCurrentId && sessions.value.find(s => s.id === savedCurrentId)) {
        currentSessionId.value = savedCurrentId
      } else if (sessions.value.length > 0) {
        currentSessionId.value = sessions.value[0].id
      }
      
      // 如果沒有任何 session，創建第一個
      if (sessions.value.length === 0) {
        createNewSession()
      }
    } catch (error) {
      console.error('Error loading sessions from storage:', error)
      createNewSession()
    }
  }

  // 切換到指定 session
  const switchSession = (sessionId) => {
    if (sessions.value.find(s => s.id === sessionId)) {
      currentSessionId.value = sessionId
      saveToStorage()
    }
  }

  // 刪除 session
  const deleteSession = (sessionId) => {
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index === -1) return

    sessions.value.splice(index, 1)
    
    // 如果刪除的是當前 session，切換到另一個
    if (currentSessionId.value === sessionId) {
      if (sessions.value.length > 0) {
        currentSessionId.value = sessions.value[0].id
      } else {
        createNewSession()
        return
      }
    }
    
    saveToStorage()
  }

  // 更新 session 標題
  const updateSessionTitle = (sessionId, newTitle) => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.title = newTitle
      session.updatedAt = new Date().toISOString()
      saveToStorage()
    }
  }

  // 添加訊息到當前 session
  const addMessageToCurrentSession = (message) => {
    const currentSession = sessions.value.find(s => s.id === currentSessionId.value)
    if (currentSession) {
      currentSession.messages.push(message)
      currentSession.updatedAt = new Date().toISOString()
      
      // 如果是用戶訊息且 session 標題是默認的，自動更新標題
      if (message.role === 'user' && currentSession.title.startsWith('新對話')) {
        const title = message.content.length > 20 
          ? message.content.substring(0, 20) + '...'
          : message.content
        updateSessionTitle(currentSession.id, title)
      }
      
      saveToStorage()
    }
  }

  // 更新當前 session 的最後一條訊息
  const updateLastMessageInCurrentSession = (content) => {
    const currentSession = sessions.value.find(s => s.id === currentSessionId.value)
    if (currentSession && currentSession.messages.length > 0) {
      const lastMessage = currentSession.messages[currentSession.messages.length - 1]
      lastMessage.content = content
      currentSession.updatedAt = new Date().toISOString()
      
      // 強制觸發響應式更新
      triggerRef(sessions)
      
      nextTick(() => {
        saveToStorage()
      })
    }
  }

  // 清空當前 session 的訊息
  const clearCurrentSession = () => {
    const currentSession = sessions.value.find(s => s.id === currentSessionId.value)
    if (currentSession) {
      currentSession.messages = []
      currentSession.updatedAt = new Date().toISOString()
      saveToStorage()
    }
  }

  // 計算屬性：當前 session
  const currentSession = computed(() => {
    return sessions.value.find(s => s.id === currentSessionId.value) || null
  })

  // 計算屬性：當前 session 的訊息
  const currentMessages = computed(() => {
    return currentSession.value?.messages || []
  })

  // 格式化時間
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

  // 初始化
  loadFromStorage()

  // 監聽變化自動保存
  watch([sessions, currentSessionId], saveToStorage, { deep: true })

  return {
    sessions,
    currentSessionId,
    currentSession,
    currentMessages,
    isLoading,
    createNewSession,
    switchSession,
    deleteSession,
    updateSessionTitle,
    addMessageToCurrentSession,
    updateLastMessageInCurrentSession,
    clearCurrentSession,
    formatTime
  }
} 