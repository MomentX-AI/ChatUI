@echo off
title Vue3 AI 聊天應用
echo.
echo ===============================================
echo        Vue3 AI 聊天應用 - 桌面版
echo ===============================================
echo.
echo 🔄 正在啟動應用...
echo.

cd /d "%~dp0.."
node desktop/server.js

pause 