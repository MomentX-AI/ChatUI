import { ref, reactive } from 'vue'

export function useChat() {
  const messages = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  
  const config = reactive({
    apiUrl: '/api/v1/chat/completions',
    model: 'TheDrummer/Rocinante-12B-v1.1-GGUF',
    temperature: 0.7,
    maxTokens: -1,
    systemMessage: '你是一個友善且有幫助的 AI 助手。'
  })

  const addMessage = (role, content) => {
    messages.value.push({
      id: Date.now() + Math.random(),
      role,
      content,
      timestamp: new Date()
    })
  }

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim()) return
    
    // Add user message
    addMessage('user', userMessage)
    isLoading.value = true
    error.value = null
    
    // Add empty assistant message for streaming
    const assistantMessageId = Date.now() + Math.random()
    messages.value.push({
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    })

    try {
      // Prepare messages for API - exclude the empty assistant message we just added
      const apiMessages = [
        { role: 'system', content: config.systemMessage },
        ...messages.value
          .filter(msg => msg.id !== assistantMessageId) // Exclude the empty assistant message
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
                const messageIndex = messages.value.findIndex(msg => msg.id === assistantMessageId)
                if (messageIndex !== -1) {
                  messages.value[messageIndex].content += content
                }
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
      messages.value = messages.value.filter(msg => msg.id !== assistantMessageId)
    } finally {
      isLoading.value = false
    }
  }

  const clearChat = () => {
    messages.value = []
    error.value = null
  }

  const updateConfig = (newConfig) => {
    Object.assign(config, newConfig)
  }

  return {
    messages,
    isLoading,
    error,
    config,
    sendMessage,
    clearChat,
    updateConfig
  }
} 