<template>
  <div v-if="contextInfo" class="context-info">
    <div class="context-header">
      <span class="context-icon">🧠</span>
      <span class="context-title">對話記憶</span>
      <button @click="toggleExpanded" class="toggle-btn">
        {{ isExpanded ? '−' : '+' }}
      </button>
    </div>
    
    <div v-if="isExpanded" class="context-details">
      <div class="stat-row">
        <span class="stat-label">訊息數量：</span>
        <span class="stat-value">{{ contextInfo.messageCount }}</span>
      </div>
      
      <div class="stat-row">
        <span class="stat-label">預估 Tokens：</span>
        <span class="stat-value">{{ contextInfo.estimatedTokens }}</span>
      </div>
      
      <div class="stat-row">
        <span class="stat-label">管理狀態：</span>
        <span class="stat-value" :class="{ 'warning': contextInfo.needsManagement }">
          {{ contextInfo.needsManagement ? '已啟用' : '正常' }}
        </span>
      </div>
      
      <div class="progress-bar">
        <div class="progress-label">記憶使用率</div>
        <div class="progress-track">
          <div 
            class="progress-fill" 
            :style="{ width: `${Math.min(100, (contextInfo.messageCount / contextInfo.maxMessages) * 100)}%` }"
            :class="{ 'warning': contextInfo.needsManagement }"
          ></div>
        </div>
        <div class="progress-text">
          {{ contextInfo.messageCount }} / {{ contextInfo.maxMessages }}
        </div>
      </div>
      
      <div class="config-section" v-if="showConfig">
        <h4>設定</h4>
        <div class="config-item">
          <label>
            <input 
              type="checkbox" 
              :checked="config.contextManagement.enabled"
              @change="updateConfig('enabled', $event.target.checked)"
            />
            啟用智能記憶管理
          </label>
        </div>
        
        <div class="config-item">
          <label>
            <input 
              type="checkbox" 
              :checked="config.contextManagement.enableSummary"
              @change="updateConfig('enableSummary', $event.target.checked)"
              :disabled="!config.contextManagement.enabled"
            />
            啟用對話摘要
          </label>
        </div>
        
        <div class="config-item">
          <label>
            最大訊息數：
            <input 
              type="number" 
              :value="config.contextManagement.maxMessages"
              @input="updateConfig('maxMessages', parseInt($event.target.value))"
              :disabled="!config.contextManagement.enabled"
              min="5"
              max="50"
            />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  contextInfo: {
    type: Object,
    default: null
  },
  config: {
    type: Object,
    required: true
  },
  showConfig: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update-config'])

const isExpanded = ref(false)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const updateConfig = (key, value) => {
  emit('update-config', {
    contextManagement: {
      ...props.config.contextManagement,
      [key]: value
    }
  })
}
</script>

<style scoped>
.context-info {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
}

.context-header {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.context-icon {
  font-size: 16px;
}

.context-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  flex: 1;
}

.toggle-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 2px 8px;
  font-size: 12px;
  transition: background-color 0.2s;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.context-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
}

.stat-value {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.stat-value.warning {
  color: #fbbf24;
}

.progress-bar {
  margin: 12px 0;
}

.progress-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
}

.progress-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  height: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-fill.warning {
  background: linear-gradient(90deg, #f59e0b, #ef4444);
}

.progress-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin-top: 4px;
}

.config-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.config-section h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.config-item {
  margin-bottom: 8px;
  font-size: 12px;
}

.config-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
}

.config-item input[type="checkbox"] {
  accent-color: #3b82f6;
}

.config-item input[type="number"] {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  padding: 4px 8px;
  width: 60px;
  margin-left: auto;
}

.config-item input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 