import { ref, reactive } from 'vue'
import { useSession } from './useSession.js'

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
  
  const config = reactive({
    apiUrl: '/api/v1/chat/completions',
    model: 'TheDrummer/Rocinante-12B-v1.1-GGUF',
    temperature: 0.7,
    maxTokens: -1,
    systemMessage: '你是一個友善且有幫助的 AI 助手。'
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

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim()) return
    
    // Add user message
    addMessage('user', userMessage)
    isLoading.value = true
    error.value = null
    
    // Add empty assistant message for streaming
    const assistantMessage = addMessage('assistant', '')

    try {
      // Prepare messages for API - exclude the empty assistant message we just added
      const apiMessages = [
        { role: 'system', content: config.systemMessage },
        ...currentMessages.value
          .filter(msg => msg.id !== assistantMessage.id) // Exclude the empty assistant message
          .filter(msg => msg.role !== 'assistant' || msg.content.trim()) // Exclude empty assistant messages
          .slice(-10) // Keep only last 10 messages for context
          .map(msg => ({ role: msg.role, content: msg.content }))
      ]

      console.log('Sending API request with messages:', apiMessages)

      const requestBody = {
        model: config.model,
        messages: apiMessages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true
      }

      console.log('Full API request:', requestBody)

      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

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
    updateConfig
  }
} 