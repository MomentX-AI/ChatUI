import { ref, computed } from 'vue'

export function useContextManager() {
  // 配置參數
  const config = ref({
    maxMessages: 100,          // 最大訊息數量
    maxTokens: 30000,          // 估計的最大 token 數量
    summaryThreshold: 10,     // 觸發摘要的訊息數量閾值
    enableSummary: true,      // 是否啟用摘要功能
    summaryLength: 3000        // 摘要長度限制
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
      // 過濾並驗證訊息
      const validMessages = messages
        .filter(msg => msg.role !== 'system')
        .filter(msg => msg.content && msg.content.trim())

      if (validMessages.length === 0) {
        console.warn('No valid messages for summary')
        return null
      }

      const conversationText = validMessages
        .map(msg => `${msg.role === 'user' ? '用戶' : 'AI'}：${msg.content}`)
        .join('\n')

      if (!conversationText.trim()) {
        console.warn('Empty conversation text for summary')
        return null
      }

      const summaryMessages = [
        {
          role: 'system',
          content: `Role: You are the session scribe for a live role-play (RP) conversation. Compress the entire scene into as few tokens as possible without losing critical in-character detail so the next LLM can seamlessly stay in-world.

Output Rules:
- Language: English.
- Length: ≤ no limits, but keep essential and details as possible 
- Format: One tight paragraph of semicolon-separated clauses, written in third-person narrator voice — no line breaks.
- Must keep: • Player & NPC names, roles, current disguises; • relationships and emotional tones; • spoken vows, bargains, secrets, and clues; • locations, timestamps, key props/items, HP/mana/status changes; • plot twists, decisions made, quest objectives, unresolved hooks, OOC rulings.
- Must drop: greetings, apologies, meta chit-chat, filler, repeated jokes.
- Style: Neutral, factual, lore-accurate; no new inventions, no commentary.
- End token: Append exactly ### END SUMMARY on a new line.`
        },
        {
          role: 'user',
          content: conversationText
        }
      ]

      // 驗證摘要訊息格式
      if (!summaryMessages.every(msg => msg.role && msg.content)) {
        console.error('Invalid summary messages format')
        return null
      }

      console.log('Creating summary with', summaryMessages.length, 'messages')

      // 調用 API 生成摘要
      const rawSummary = await apiCall(summaryMessages)
      
      if (!rawSummary || !rawSummary.trim()) {
        console.warn('Empty summary response')
        return null
      }
      
      // 處理摘要響應，移除 END SUMMARY 標記
      const summary = rawSummary.replace(/### END SUMMARY\s*$/i, '').trim()
      
      return {
        role: 'system',
        content: `Previous conversation summary: ${summary}`,
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
        // 計算要保留的最近訊息數量 (確保摘要是有意義的)
        const recentMessageCount = Math.min(8, Math.floor(config.value.maxMessages * 0.6))
        const earlyMessages = conversationMessages.slice(0, -recentMessageCount)
        const recentMessages = conversationMessages.slice(-recentMessageCount)

        console.log(`Creating summary for ${earlyMessages.length} early messages, keeping ${recentMessages.length} recent messages`)

        // 生成摘要
        const summary = await createSummary(earlyMessages, apiCall)
        
        if (summary) {
          // 返回：系統訊息 + 摘要 + 最近的訊息
          return [
            { role: 'system', content: systemMessage },
            { role: 'system', content: summary.content },
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