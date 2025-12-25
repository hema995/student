@echo off
chcp 65001 >nul
echo ===================================
echo نظام إدارة بيانات الطلاب
echo Student Management System
echo ===================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js غير مثبت على جهازك
    echo ❌ Node.js is not installed
    echo.
    echo قم بتثبيت Node.js من: https://nodejs.org
    pause
    exit /b 1
)

echo ✓ Node.js مثبت
echo.

if not exist "node_modules\" (
    echo 📦 جاري تثبيت الحزم...
    echo 📦 Installing packages...
    call npm install
    echo.
)

if not exist "dist\public\" (
    echo 🔨 جاري بناء التطبيق...
    echo 🔨 Building application...
    call npm run build
    echo.
)

echo 🚀 جاري تشغيل التطبيق...
echo 🚀 Starting application...
echo.

call npm run start:electron
