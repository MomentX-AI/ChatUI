import { ref, reactive } from 'vue'
import { useSession } from './useSession.js'
import { useContextManager } from './useContextManager.js'

export function useChat() {
  const isLoading = ref(false)
  const error = ref(null)
  
  // 使用 session 管理
  const {
    sessions,
    currentSessionId,
    currentSession,
    currentMessages,
    createNewSession,
    switchSession,
    deleteSession,
    updateSessionTitle,
    addMessageToCurrentSession,
    updateLastMessageInCurrentSession,
    clearCurrentSession
  } = useSession()

  // 使用上下文管理器
  const {
    config: contextConfig,
    manageContext,
    getContextStats,
    needsContextManagement,
    updateConfig: updateContextConfig
  } = useContextManager()
  
  const config = reactive({
    apiUrl: '/api/v1/chat/completions',
    model: 'TheDrummer/Rocinante-12B-v1.1-GGUF',
    temperature: 0.7,
    maxTokens: -1,
    systemMessage: '你是一個友善且有幫助的 AI 助手。請根據對話歷史提供有意義的回答。',
    // 上下文管理配置
    contextManagement: {
      enabled: true,
      maxMessages: 20,
      summaryThreshold: 15,
      enableSummary: true
    }
  })

  const addMessage = (role, content) => {
    const message = {
      id: Date.now() + Math.random(),
      role,
      content,
      timestamp: new Date()
    }
    addMessageToCurrentSession(message)
    return message
  }

  // 調用 API 的輔助函數（用於生成摘要）
  const callApi = async (messages, stream = false) => {
    const requestBody = {
      model: config.model,
      messages: messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: stream
    }

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (stream) {
      return response
    } else {
      // 非流式調用（用於摘要）
      const result = await response.json()
      return result.choices[0].message.content
    }
  }

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim()) return
    
    // Add user message
    addMessage('user', userMessage)
    isLoading.value = true
    error.value = null
    
    // Add empty assistant message for streaming
    const assistantMessage = addMessage('assistant', '')

    try {
      // 獲取當前對話統計
      const stats = getContextStats(currentMessages.value)
      console.log('Context stats:', stats)

      // 準備 API 訊息，使用智能上下文管理
      let apiMessages
      
      if (config.contextManagement.enabled && needsContextManagement(currentMessages.value)) {
        console.log('Applying context management...')
        
        // 更新上下文配置
        updateContextConfig({
          maxMessages: config.contextManagement.maxMessages,
          summaryThreshold: config.contextManagement.summaryThreshold,
          enableSummary: config.contextManagement.enableSummary
        })
        
        // 過濾掉空的助手訊息
        const filteredMessages = currentMessages.value
          .filter(msg => msg.id !== assistantMessage.id)
          .filter(msg => msg.role !== 'assistant' || msg.content.trim())

        // 使用智能上下文管理
        apiMessages = await manageContext(
          filteredMessages,
          config.systemMessage,
          callApi
        )
      } else {
        // 使用簡單的滑動窗口
        apiMessages = [
          { role: 'system', content: config.systemMessage },
          ...currentMessages.value
            .filter(msg => msg.id !== assistantMessage.id)
            .filter(msg => msg.role !== 'assistant' || msg.content.trim())
            .slice(-10)
            .map(msg => ({ role: msg.role, content: msg.content }))
        ]
      }

      console.log(`Sending ${apiMessages.length} messages to API`)

      // 調用流式 API
      const response = await callApi(apiMessages, true)
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                // Update the assistant message content
                assistantMessage.content += content
                updateLastMessageInCurrentSession(assistantMessage.content)
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data)
            }
          }
        }
      }

      // 對話完成後，顯示新的統計信息
      const newStats = getContextStats(currentMessages.value)
      console.log('Updated context stats:', newStats)

    } catch (err) {
      error.value = err.message || '發送訊息時發生錯誤'
      console.error('Chat error:', err)
      
      // Remove the empty assistant message if there was an error
      if (currentSession.value && assistantMessage) {
        const index = currentSession.value.messages.findIndex(msg => msg.id === assistantMessage.id)
        if (index !== -1) {
          currentSession.value.messages.splice(index, 1)
        }
      }
    } finally {
      isLoading.value = false
    }
  }

  const clearChat = () => {
    clearCurrentSession()
    error.value = null
  }

  const updateConfig = (newConfig) => {
    Object.assign(config, newConfig)
    
    // 同時更新上下文管理配置
    if (newConfig.contextManagement) {
      updateContextConfig(newConfig.contextManagement)
    }
  }

  // 獲取當前對話的上下文信息
  const getContextInfo = () => {
    if (!currentMessages.value.length) return null
    return getContextStats(currentMessages.value)
  }

  return {
    // Session 管理
    sessions,
    currentSessionId,
    currentSession,
    currentMessages,
    createNewSession,
    switchSession,
    deleteSession,
    updateSessionTitle,
    
    // 聊天功能
    isLoading,
    error,
    config,
    sendMessage,
    clearChat,
    updateConfig,
    
    // 上下文管理
    getContextInfo,
    contextConfig
  }
} 