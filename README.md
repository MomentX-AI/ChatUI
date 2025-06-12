# Vue3 AI 聊天 UI

一個使用 Vue3 開發的現代化 AI 聊天界面，支援與本地 AI 模型進行流式對話。

## 功能特色

- 🎨 **現代化設計**: 美觀的玻璃擬態設計風格
- 💬 **實時聊天**: 支援流式響應，實時顯示 AI 回答
- ⚙️ **自定義設定**: 可調整 API 網址、模型參數等
- 📱 **響應式設計**: 支援桌面和移動設備
- 🔄 **自動滾動**: 新訊息自動滾動到底部
- 💾 **錯誤處理**: 友善的錯誤提示

## 系統需求

- Node.js 16+ 
- 本地 AI 服務運行在 `http://localhost:1234`

## 安裝與運行

1. **安裝依賴**
```bash
npm install
```

2. **啟動開發服務器**
```bash
npm run dev
```

3. **構建生產版本**
```bash
npm run build
```

## 使用說明

### 基本操作

1. **發送訊息**: 在底部輸入框輸入訊息，按 Enter 或點擊發送按鈕
2. **查看回答**: AI 的回答會以流式方式實時顯示
3. **清除對話**: 點擊右上角的垃圾桶圖標清除所有對話記錄

### 設定配置

點擊右上角的設定圖標可以調整以下參數：

- **API 網址**: AI 服務的端點 (預設: `http://localhost:1234/v1/chat/completions`)
- **模型**: 使用的 AI 模型名稱
- **溫度**: 控制回答的隨機性 (0-1，數值越高越隨機)
- **系統訊息**: 設定 AI 的行為和角色

### 鍵盤快捷鍵

- `Enter`: 發送訊息
- `Shift + Enter`: 在輸入框中換行

## API 兼容性

此應用與 OpenAI ChatGPT API 格式兼容，支援以下 API 端點：

- `POST /v1/chat/completions` - 聊天對話
- `GET /v1/models` - 獲取可用模型列表

### API 請求格式

```json
{
  "model": "TheDrummer/Rocinante-12B-v1.1-GGUF",
  "messages": [
    { "role": "system", "content": "你是一個友善且有幫助的 AI 助手。" },
    { "role": "user", "content": "你好" }
  ],
  "temperature": 0.7,
  "max_tokens": -1,
  "stream": true
}
```

## 技術架構

- **前端框架**: Vue 3 (Composition API)
- **構建工具**: Vite
- **樣式**: CSS3 (玻璃擬態效果)
- **HTTP 客戶端**: Fetch API (原生)
- **狀態管理**: Vue 3 響應式系統 + Composables

## 項目結構

```
src/
├── components/
│   ├── ChatMessage.vue    # 聊天訊息組件
│   └── ChatInput.vue      # 訊息輸入組件
├── composables/
│   └── useChat.js         # 聊天功能邏輯
├── App.vue                # 主應用組件
├── main.js                # 應用入口
└── style.css              # 全局樣式
```

## 開發說明

### 添加新功能

1. 在 `src/composables/useChat.js` 中添加新的聊天功能
2. 在相應組件中使用新功能
3. 更新樣式以匹配設計風格

### 自定義樣式

所有樣式都使用 CSS 變量，可以輕鬆自定義：

```css
:root {
  --primary-color: #2196f3;
  --background-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --chat-background: rgba(255, 255, 255, 0.95);
}
```

## 故障排除

### 常見問題

1. **無法連接到 AI 服務**
   - 確認 AI 服務正在運行
   - 檢查 API 網址設定是否正確
   - 查看瀏覽器控制台的錯誤訊息

2. **訊息發送失敗**
   - 檢查網絡連接
   - 確認 API 格式是否正確
   - 查看伺服器日誌

3. **樣式顯示異常**
   - 清除瀏覽器緩存
   - 確認所有 CSS 文件已正確加載

## 貢獻指南

歡迎提交 Issue 和 Pull Request 來改進這個項目！

## 授權

此項目採用 MIT 授權條款。 