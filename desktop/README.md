# Vue3 AI 聊天應用 - 桌面版

## 方案一：快速啟動（推薦）

### 使用方法
1. **雙擊 `ChatUI.bat`** - 這是最簡單的啟動方式
2. 應用會自動檢查環境並構建（如果需要）
3. 服務器啟動後會自動在瀏覽器中開啟

### 功能特色
- ✅ 自動檢查 Node.js 環境
- ✅ 自動安裝依賴（如果需要）
- ✅ 自動構建應用（如果需要）
- ✅ 自動開啟瀏覽器
- ✅ 美觀的終端界面
- ✅ 中文支援
- ✅ 內建 API 代理功能，自動轉發請求到 AI 服務

## 方案二：打包成可執行檔案

### 構建步驟
```bash
# 1. 安裝新依賴
npm install

# 2. 構建應用
npm run build

# 3. 打包成可執行檔案
npm run build:desktop
```

### 生成的檔案
- `ChatUI-Windows.exe` - Windows 可執行檔案
- 檔案大小約 40-50MB
- 無需安裝 Node.js 環境即可運行

## 系統需求

### 方案一要求
- Windows 10/11
- Node.js 16+ 
- 網路連接（用於安裝依賴）

### 方案二要求
- Windows 10/11
- 無需額外環境

## 使用注意事項

1. **AI 服務**: 確保你的 AI 服務運行在 `http://localhost:1234`
2. **防火牆**: 第一次運行時系統可能詢問防火牆權限，請允許
3. **連接埠**: 應用會使用 3000 連接埠，請確保該連接埠未被占用
4. **關閉應用**: 在終端視窗按 `Ctrl+C` 或直接關閉視窗
5. **API 代理**: 桌面應用會自動將 `/api/v1/*` 請求代理到 `http://localhost:1234/v1/*`

## 檔案結構

```
desktop/
├── ChatUI.bat          # 主啟動檔案
├── server.js           # Express 服務器
├── build.js            # 打包腳本
├── start.bat           # 簡單啟動腳本
└── README.md           # 這個說明檔案
```

## 故障排除

### 常見問題

1. **找不到 Node.js**
   - 下載並安裝 Node.js: https://nodejs.org/
   - 重新啟動命令提示字元

2. **連接埠被占用**
   - 修改 `server.js` 中的 `PORT` 變數
   - 或關閉占用 3000 連接埠的其他應用

3. **瀏覽器未自動開啟**
   - 手動開啟瀏覽器並訪問 `http://localhost:3000`

4. **應用無法構建**
   - 確保網路連接正常
   - 嘗試刪除 `node_modules` 資料夾後重新執行

### 手動操作

如果自動啟動失敗，可以手動執行：

```bash
# 切換到項目根目錄
cd /path/to/your/project

# 安裝依賴
npm install

# 構建應用
npm run build

# 啟動桌面版
npm run start:desktop
```

## 自定義設定

### 修改連接埠
編輯 `desktop/server.js` 檔案中的 `PORT` 變數：
```javascript
const PORT = 3000; // 改為其他連接埠
```

### 修改 AI 服務地址
在瀏覽器中開啟應用後，點擊右上角的設定圖標進行配置。 