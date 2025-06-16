const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 開始打包 Vue3 AI 聊天桌面應用...');

// 確保 dist 目錄存在
if (!fs.existsSync('dist')) {
  console.error('❌ 錯誤: dist 目錄不存在，請先運行 npm run build');
  process.exit(1);
}

// 創建主應用檔案
const mainAppContent = `
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
    const targetUrl = AI_SERVICE_URL + '/v1' + req.path;
    console.log('🔄 代理請求: ' + req.method + ' ' + req.originalUrl + ' -> ' + targetUrl);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    // 如果是流式響應，直接轉發
    if (response.headers.get('content-type') && response.headers.get('content-type').includes('text/event-stream')) {
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
          const result = await reader.read();
          if (result.done) break;
          res.write(decoder.decode(result.value));
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
app.use(express.static(path.join(__dirname, 'dist')));

// 所有其他路由都返回 index.html (SPA 支援)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// 啟動服務器
app.listen(PORT, () => {
  console.log('🚀 Vue3 AI 聊天應用已啟動！');
  console.log('📝 本地訪問: http://localhost:' + PORT);
  console.log('🔄 正在自動開啟瀏覽器...');
  
  // 延遲1秒後開啟瀏覽器，確保服務器完全啟動
  setTimeout(() => {
    open('http://localhost:' + PORT);
  }, 1000);
});

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\\n👋 感謝使用 Vue3 AI 聊天應用！');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n👋 感謝使用 Vue3 AI 聊天應用！');
  process.exit(0);
});
`;

// 寫入主應用檔案
fs.writeFileSync('desktop/main.js', mainAppContent);

// 打包命令
const pkgCommands = [
  'npx pkg desktop/main.js --targets node18-win-x64 --output ChatUI-Windows.exe',
  'npx pkg desktop/main.js --targets node18-macos-x64 --output ChatUI-macOS',
  'npx pkg desktop/main.js --targets node18-linux-x64 --output ChatUI-Linux'
];

console.log('📦 正在生成可執行檔案...');

// 只打包 Windows 版本（基於用戶的作業系統）
exec(pkgCommands[0], (error, stdout, stderr) => {
  if (error) {
    console.error('❌ 打包失敗:', error);
    return;
  }
  
  if (stderr) {
    console.warn('⚠️ 警告:', stderr);
  }
  
  console.log('✅ Windows 可執行檔案已生成: ChatUI-Windows.exe');
  console.log('');
  console.log('📋 使用說明:');
  console.log('1. 雙擊 ChatUI-Windows.exe 啟動應用');
  console.log('2. 應用會自動在瀏覽器中開啟');
  console.log('3. 確保你的 AI 服務運行在 http://localhost:1234');
  console.log('');
  console.log('🎉 打包完成！');
});

// 如果需要打包其他平台，取消註釋以下代碼
/*
Promise.all(pkgCommands.map(cmd => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ cmd, stdout, stderr });
      }
    });
  });
})).then(results => {
  console.log('✅ 所有平台的可執行檔案已生成完成！');
  results.forEach(result => {
    console.log(`✓ ${result.cmd.split(' ')[4]}`);
  });
}).catch(error => {
  console.error('❌ 打包過程中出現錯誤:', error);
});
*/ 