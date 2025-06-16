import { ref, reactive } from 'vue'
import { useSession } from './useSession.js'
import { useContextManager } from './useContextManager.js'

export function useChat() {
  const isLoading = ref(false)
  const error = ref(null)
  const abortController = ref(null)
  
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
    clearCurrentSession,
    removeLastMessageFromCurrentSession,
    removeMessageFromCurrentSession,
    editMessageInCurrentSession
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
    systemMessage: '你是一個友善且有幫助的 AI 助手。請仔細閱讀並記住我們之間的完整對話歷史，在回答時要考慮之前討論過的所有內容和上下文。如果用戶提及之前的話題或問題，請明確引用相關的對話內容。',
    // 上下文管理配置
    contextManagement: {
      enabled: true,
      maxMessages: 15,
      summaryThreshold: 10,
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
  const callApi = async (messages, stream = false, controller = null) => {
    // 驗證 messages 參數
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages: messages must be a non-empty array')
    }

    // 驗證每個 message 的格式
    const invalidMessage = messages.find(msg => !msg.role || !msg.content)
    if (invalidMessage) {
      throw new Error('Invalid message format: each message must have role and content')
    }

    const requestBody = {
      model: config.model,
      messages: messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: stream
    }

    console.log('Making API request to:', config.apiUrl)
    console.log('Request body:', JSON.stringify(requestBody, null, 2))
    console.log('Messages count:', messages.length)

    try {
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }

      // 如果提供了 AbortController，添加 signal
      if (controller) {
        fetchOptions.signal = controller.signal
      }

      const response = await fetch(config.apiUrl, fetchOptions)

      console.log('API Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      if (stream) {
        return response
      } else {
        // 非流式調用（用於摘要）
        const result = await response.json()
        console.log('Non-stream API result:', result)
        return result.choices[0].message.content
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      throw fetchError
    }
  }

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim()) return
    
    // Add user message
    addMessage('user', userMessage)
    isLoading.value = true
    error.value = null
    
    // 創建新的 AbortController
    abortController.value = new AbortController()
    
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
      console.log('API Messages:', JSON.stringify(apiMessages, null, 2))

      // 調用流式 API
      const response = await callApi(apiMessages, true, abortController.value)
      console.log('API Response received, status:', response.status)
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()))
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let totalChunks = 0
      let totalContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('Stream finished. Total chunks:', totalChunks, 'Total content length:', totalContent.length)
          break
        }

        totalChunks++
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              console.log('Received [DONE] signal')
              continue
            }
            
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                totalContent += content
                // Update the assistant message content
                assistantMessage.content += content
                updateLastMessageInCurrentSession(assistantMessage.content)
                console.log('Received content chunk:', content.length, 'chars', 'Total length:', assistantMessage.content.length)
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data, 'Error:', e.message)
            }
          }
        }
      }

      // 對話完成後，顯示新的統計信息
      const newStats = getContextStats(currentMessages.value)
      console.log('Updated context stats:', newStats)

    } catch (err) {
      // 檢查是否為用戶主動中斷
      if (err.name === 'AbortError') {
        console.log('Request was aborted by user')
        error.value = null // 用戶主動中斷不視為錯誤
      } else {
        error.value = err.message || '發送訊息時發生錯誤'
        console.error('Chat error:', err)
        
        // Remove the empty assistant message if there was an error
        if (currentSession.value && assistantMessage) {
          const index = currentSession.value.messages.findIndex(msg => msg.id === assistantMessage.id)
          if (index !== -1) {
            currentSession.value.messages.splice(index, 1)
          }
        }
      }
    } finally {
      isLoading.value = false
      abortController.value = null
    }
  }

  const clearChat = () => {
    clearCurrentSession()
    error.value = null
  }

  // 重新生成最後一條AI回覆
  const regenerateLastResponse = async () => {
    if (isLoading.value) return // 如果正在加載中，則不執行

    const messages = currentMessages.value
    if (messages.length === 0) return

    // 檢查最後一條消息是否是AI回覆
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== 'assistant') return

    // 檢查是否有對應的用戶消息
    let userMessageIndex = -1
    for (let i = messages.length - 2; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessageIndex = i
        break
      }
    }

    if (userMessageIndex === -1) return // 沒有找到對應的用戶消息

    const userMessage = messages[userMessageIndex].content

    // 刪除最後一條AI回覆
    removeMessageFromCurrentSession(lastMessage.id)

    // 重新發送用戶消息以獲取新的AI回覆
    await regenerateResponse(userMessage)
  }

  // 重新生成指定消息的回覆
  const regenerateResponse = async (userMessage) => {
    isLoading.value = true
    error.value = null
    
    // 創建新的 AbortController
    abortController.value = new AbortController()
    
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

      console.log(`Regenerating response with ${apiMessages.length} messages`)
      console.log('API Messages:', JSON.stringify(apiMessages, null, 2))

      // 調用流式 API
      const response = await callApi(apiMessages, true, abortController.value)
      console.log('API Response received, status:', response.status)
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let totalChunks = 0
      let totalContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('Regeneration stream finished. Total chunks:', totalChunks, 'Total content length:', totalContent.length)
          break
        }

        totalChunks++
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              console.log('Received [DONE] signal')
              continue
            }
            
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                totalContent += content
                // Update the assistant message content
                assistantMessage.content += content
                updateLastMessageInCurrentSession(assistantMessage.content)
                console.log('Received content chunk:', content.length, 'chars', 'Total length:', assistantMessage.content.length)
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data, 'Error:', e.message)
            }
          }
        }
      }

      // 對話完成後，顯示新的統計信息
      const newStats = getContextStats(currentMessages.value)
      console.log('Updated context stats:', newStats)

    } catch (err) {
      // 檢查是否為用戶主動中斷
      if (err.name === 'AbortError') {
        console.log('Regeneration was aborted by user')
        error.value = null // 用戶主動中斷不視為錯誤
      } else {
        error.value = err.message || '重新生成回覆時發生錯誤'
        console.error('Regeneration error:', err)
        
        // Remove the empty assistant message if there was an error
        if (currentSession.value && assistantMessage) {
          const index = currentSession.value.messages.findIndex(msg => msg.id === assistantMessage.id)
          if (index !== -1) {
            currentSession.value.messages.splice(index, 1)
          }
        }
      }
    } finally {
      isLoading.value = false
      abortController.value = null
    }
  }

  const updateConfig = (newConfig) => {
    Object.assign(config, newConfig)
    
    // 同時更新上下文管理配置
    if (newConfig.contextManagement) {
      updateContextConfig(newConfig.contextManagement)
    }
  }

  // 刪除訊息
  const deleteMessage = (messageId) => {
    return removeMessageFromCurrentSession(messageId)
  }

  // 編輯訊息
  const editMessage = (messageId, newContent) => {
    return editMessageInCurrentSession(messageId, newContent)
  }

  // 停止生成回覆
  const stopGeneration = () => {
    if (abortController.value) {
      console.log('Stopping AI response generation...')
      abortController.value.abort()
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
    regenerateLastResponse,
    
    // 訊息管理
    deleteMessage,
    editMessage,
    
    // 生成控制
    stopGeneration,
    
    // 上下文管理
    getContextInfo,
    contextConfig
  }
} 