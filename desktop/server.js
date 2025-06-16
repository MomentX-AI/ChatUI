const express = require('express');
const path = require('path');
const open = require('open');

const app = express();
const PORT = 3000;
const AI_SERVICE_URL = 'http://localhost:1234'; // AI 服務地址

// 中間件：解析 JSON
app.use(express.json());

// API 代理 - 將前端的 API 請求轉發到 AI 服務
app.use('/api/v1', async (req, res) => {
  try {
    const targetUrl = `${AI_SERVICE_URL}/v1${req.path}`;
    console.log(`🔄 代理請求: ${req.method} ${req.originalUrl} -> ${targetUrl}`);
    console.log(`📝 請求體:`, JSON.stringify(req.body, null, 2));

    // 準備請求選項
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json',
        'Cache-Control': 'no-cache'
      }
    };

    // 如果有請求體，添加到選項中
    if (req.method !== 'GET' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // 如果是流式響應，直接轉發
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      res.writeHead(response.status, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value));
        }
      } finally {
        res.end();
      }
    } else {
      // 非流式響應
      const data = await response.text();
      res.status(response.status);
      res.set(Object.fromEntries(response.headers.entries()));
      res.send(data);
    }
  } catch (error) {
    console.error('❌ 代理請求失敗:', error.message);
    res.status(502).json({ 
      error: 'Proxy Error', 
      message: '無法連接到 AI 服務，請確保 AI 服務運行在 ' + AI_SERVICE_URL,
      details: error.message 
    });
  }
});

// 設定靜態檔案目錄
app.use(express.static(path.join(__dirname, '../dist')));

// 所有其他路由都返回 index.html (SPA 支援)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`🚀 Vue3 AI 聊天應用已啟動！`);
  console.log(`📝 本地訪問: http://localhost:${PORT}`);
  console.log(`🔄 正在自動開啟瀏覽器...`);
  
  // 延遲1秒後開啟瀏覽器，確保服務器完全啟動
  setTimeout(() => {
    open(`http://localhost:${PORT}`);
  }, 1000);
});

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\n👋 感謝使用 Vue3 AI 聊天應用！');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 感謝使用 Vue3 AI 聊天應用！');
  process.exit(0);
}); 