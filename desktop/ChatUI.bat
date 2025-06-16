@echo off
chcp 65001 >nul
title Vue3 AI 聊天應用

:: 設定視窗樣式
mode con cols=80 lines=25
color 0F

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                        Vue3 AI 聊天應用 - 桌面版                           ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo 🚀 正在啟動 Vue3 AI 聊天應用...
echo 📝 服務器將運行在: http://localhost:3000
echo 🔄 瀏覽器將自動開啟...
echo.
echo ⚠️  注意: 請確保您的 AI 服務已運行在 http://localhost:1234
echo.
echo ═══════════════════════════════════════════════════════════════════════════════

:: 切換到項目根目錄
cd /d "%~dp0.."

:: 檢查 Node.js 是否安裝
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 錯誤: 未找到 Node.js，請先安裝 Node.js
    echo 📥 下載地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 檢查是否已構建
if not exist "dist" (
    echo 📦 首次運行，正在構建應用...
    call npm run build
)

:: 檢查依賴是否安裝
if not exist "node_modules" (
    echo 📥 正在安裝依賴...
    call npm install
)

:: 啟動服務器
echo.
echo 🎉 正在啟動服務器...
node desktop/server.js

echo.
echo 👋 感謝使用 Vue3 AI 聊天應用！
pause 