import { ref, computed } from 'vue'

export function useContextManager() {
  // 配置參數
  const config = ref({
    maxMessages: 20,          // 最大訊息數量
    maxTokens: 3000,          // 估計的最大 token 數量
    summaryThreshold: 15,     // 觸發摘要的訊息數量閾值
    enableSummary: true,      // 是否啟用摘要功能
    summaryLength: 200        // 摘要長度限制
  })

  // 簡單的 token 估算（1 token ≈ 4 字符）
  const estimateTokens = (text) => {
    if (!text) return 0
    return Math.ceil(text.length / 4)
  }

  // 計算訊息列表的總 token 數
  const calculateMessageTokens = (messages) => {
    return messages.reduce((total, msg) => {
      return total + estimateTokens(msg.content) + 10 // 每條訊息額外 10 tokens 的開銷
    }, 0)
  }

  // 滑動窗口策略：保留最近的 N 條訊息
  const applySlidingWindow = (messages, maxCount) => {
    if (messages.length <= maxCount) return messages
    
    // 保留系統訊息
    const systemMessages = messages.filter(msg => msg.role === 'system')
    const nonSystemMessages = messages.filter(msg => msg.role !== 'system')
    
    // 保留最近的對話
    const recentMessages = nonSystemMessages.slice(-maxCount)
    
    return [...systemMessages, ...recentMessages]
  }

  // 創建對話摘要
  const createSummary = async (messages, apiCall) => {
    try {
      const conversationText = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role === 'user' ? '用戶' : 'AI'}：${msg.content}`)
        .join('\n')

      const summaryMessages = [
        {
          role: 'system',
          content: '請將以下對話簡潔地總結為重要信息，保留關鍵事實和上下文，限制在 200 字以內：'
        },
        {
          role: 'user',
          content: conversationText
        }
      ]

      // 調用 API 生成摘要
      const summary = await apiCall(summaryMessages)
      
      return {
        role: 'assistant',
        content: `[對話摘要] ${summary}`,
        id: Date.now() + Math.random(),
        timestamp: new Date(),
        isSummary: true
      }
    } catch (error) {
      console.error('Failed to create summary:', error)
      return null
    }
  }

  // 智能上下文管理：結合滑動窗口和摘要
  const manageContext = async (messages, systemMessage, apiCall) => {
    // 分離系統訊息和對話訊息
    const conversationMessages = messages.filter(msg => msg.role !== 'system')
    
    // 如果訊息數量在限制內，直接返回
    if (conversationMessages.length <= config.value.maxMessages) {
      return [
        { role: 'system', content: systemMessage },
        ...conversationMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ]
    }

    console.log(`Managing context: ${conversationMessages.length} messages, threshold: ${config.value.summaryThreshold}`)

    // 如果啟用摘要且超過閾值
    if (config.value.enableSummary && conversationMessages.length > config.value.summaryThreshold) {
      // 取早期訊息進行摘要
      const earlyMessages = conversationMessages.slice(0, -config.value.maxMessages + 5)
      const recentMessages = conversationMessages.slice(-config.value.maxMessages + 5)

      console.log(`Creating summary for ${earlyMessages.length} early messages`)

      // 生成摘要
      const summary = await createSummary(earlyMessages, apiCall)
      
      if (summary) {
        // 返回：系統訊息 + 摘要 + 最近的訊息
        return [
          { role: 'system', content: systemMessage },
          { role: 'assistant', content: summary.content },
          ...recentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ]
      }
    }

    // 降級到滑動窗口策略
    console.log('Falling back to sliding window strategy')
    const windowedMessages = applySlidingWindow(conversationMessages, config.value.maxMessages)
    
    return [
      { role: 'system', content: systemMessage },
      ...windowedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ]
  }

  // 檢查是否需要上下文管理
  const needsContextManagement = (messages) => {
    const conversationMessages = messages.filter(msg => msg.role !== 'system')
    const totalTokens = calculateMessageTokens(conversationMessages)
    
    return conversationMessages.length > config.value.maxMessages || 
           totalTokens > config.value.maxTokens
  }

  // 獲取上下文統計信息
  const getContextStats = (messages) => {
    const conversationMessages = messages.filter(msg => msg.role !== 'system')
    const totalTokens = calculateMessageTokens(conversationMessages)
    
    return {
      messageCount: conversationMessages.length,
      estimatedTokens: totalTokens,
      needsManagement: needsContextManagement(messages),
      maxMessages: config.value.maxMessages,
      maxTokens: config.value.maxTokens
    }
  }

  // 更新配置
  const updateConfig = (newConfig) => {
    Object.assign(config.value, newConfig)
  }

  return {
    config,
    estimateTokens,
    calculateMessageTokens,
    applySlidingWindow,
    createSummary,
    manageContext,
    needsContextManagement,
    getContextStats,
    updateConfig
  }
} 