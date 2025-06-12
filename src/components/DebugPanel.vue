<template>
  <div class="debug-panel">
    <div class="debug-header" @click="isExpanded = !isExpanded">
      <span class="debug-title">🐛 調試信息</span>
      <button class="toggle-btn">{{ isExpanded ? '−' : '+' }}</button>
    </div>
    
    <div v-if="isExpanded" class="debug-content">
      <div class="debug-controls">
        <button @click="clearLogs" class="clear-btn">清除日誌</button>
        <label class="auto-scroll-label">
          <input type="checkbox" v-model="autoScroll" />
          自動滾動
        </label>
      </div>
      
      <div class="debug-logs" ref="logsContainer">
        <div 
          v-for="(log, index) in logs" 
          :key="index"
          class="log-entry"
          :class="log.type"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-message">{{ log.message }}</span>
          <pre v-if="log.data" class="log-data">{{ log.data }}</pre>
        </div>
        
        <div v-if="logs.length === 0" class="no-logs">
          暫無調試信息
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'

const isExpanded = ref(false)
const autoScroll = ref(true)
const logs = ref([])
const logsContainer = ref(null)

// 監聽控制台日誌
onMounted(() => {
  // 攔截 console.log
  const originalLog = console.log
  console.log = (...args) => {
    originalLog.apply(console, args)
    
    // 檢查是否是我們關心的日誌
    const message = args.join(' ')
    if (message.includes('Context stats') || 
        message.includes('Sending') || 
        message.includes('Managing context') || 
        message.includes('Creating summary') ||
        message.includes('API Messages')) {
      
      let logType = 'info'
      let logData = null
      
      if (message.includes('Context stats')) {
        logType = 'stats'
        if (args.length > 1 && typeof args[1] === 'object') {
          logData = JSON.stringify(args[1], null, 2)
        }
      } else if (message.includes('API Messages')) {
        logType = 'api'
        if (args.length > 1 && typeof args[1] === 'object') {
          logData = JSON.stringify(args[1], null, 2)
        }
      } else if (message.includes('Managing context')) {
        logType = 'manage'
      } else if (message.includes('Creating summary')) {
        logType = 'summary'
      }
      
      addLog(message, logType, logData)
    }
  }
})

const addLog = (message, type = 'info', data = null) => {
  logs.value.push({
    timestamp: new Date(),
    message,
    type,
    data
  })
  
  // 限制日誌數量
  if (logs.value.length > 50) {
    logs.value.shift()
  }
  
  if (autoScroll.value) {
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const clearLogs = () => {
  logs.value = []
}

const scrollToBottom = () => {
  if (logsContainer.value) {
    logsContainer.value.scrollTop = logsContainer.value.scrollHeight
  }
}

const formatTime = (timestamp) => {
  return timestamp.toLocaleTimeString('zh-TW', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 當日誌變化時自動滾動
watch(logs, () => {
  if (autoScroll.value) {
    nextTick(() => {
      scrollToBottom()
    })
  }
}, { deep: true })
</script>

<style scoped>
.debug-panel {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
}

.debug-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.debug-title {
  color: #00ff00;
  font-weight: bold;
}

.toggle-btn {
  background: none;
  border: none;
  color: #00ff00;
  cursor: pointer;
  font-family: monospace;
  font-size: 12px;
}

.debug-content {
  max-height: 300px;
  display: flex;
  flex-direction: column;
}

.debug-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

.clear-btn {
  background: #ff4444;
  border: none;
  border-radius: 4px;
  color: white;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 10px;
}

.auto-scroll-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 10px;
  cursor: pointer;
}

.debug-logs {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  min-height: 100px;
  max-height: 200px;
}

.log-entry {
  margin-bottom: 4px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.log-time {
  color: #888;
  margin-right: 8px;
}

.log-message {
  color: #ccc;
}

.log-data {
  margin: 4px 0 0 0;
  padding: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  color: #00ff00;
  font-size: 10px;
  overflow-x: auto;
  white-space: pre-wrap;
}

.log-entry.stats .log-message {
  color: #3b82f6;
}

.log-entry.api .log-message {
  color: #10b981;
}

.log-entry.manage .log-message {
  color: #f59e0b;
}

.log-entry.summary .log-message {
  color: #ef4444;
}

.no-logs {
  color: #666;
  text-align: center;
  padding: 20px;
  font-style: italic;
}

/* 滾動條樣式 */
.debug-logs::-webkit-scrollbar {
  width: 4px;
}

.debug-logs::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.debug-logs::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}
</style> 