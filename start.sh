#!/bin/bash

echo "==================================="
echo "نظام إدارة بيانات الطلاب"
echo "Student Management System"
echo "==================================="
echo ""

if ! command -v node &> /dev/null
then
    echo "❌ Node.js غير مثبت على جهازك"
    echo "❌ Node.js is not installed"
    echo ""
    echo "قم بتثبيت Node.js من: https://nodejs.org"
    exit 1
fi

echo "✓ Node.js مثبت"
echo ""

if [ ! -d "node_modules" ]; then
    echo "📦 جاري تثبيت الحزم..."
    echo "📦 Installing packages..."
    npm install
    echo ""
fi

if [ ! -d "dist/public" ]; then
    echo "🔨 جاري بناء التطبيق..."
    echo "🔨 Building application..."
    npm run build
    echo ""
fi

echo "🚀 جاري تشغيل التطبيق..."
echo "🚀 Starting application..."
echo ""

npm run start:electron
