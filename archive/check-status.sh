#!/bin/bash

echo "🔥 AI热点监控工具 - 项目状态检查"
echo "===================================="
echo ""

# 检查Docker
echo "🐳 Docker状态："
if command -v docker &> /dev/null; then
    echo "✅ Docker已安装"
    docker --version
else
    echo "❌ Docker未安装"
fi
echo ""

# 检查Node.js
echo "📦 Node.js状态："
if command -v node &> /dev/null; then
    echo "✅ Node.js已安装"
    node --version
    echo "npm版本："
    npm --version
else
    echo "❌ Node.js未安装"
fi
echo ""

# 检查项目文件
echo "📁 项目文件检查："
cd "D:\Claude code\ai-hotspot-monitor"

if [ -f "backend/package.json" ]; then
    echo "✅ 后端package.json存在"
else
    echo "❌ 后端package.json缺失"
fi

if [ -f "frontend/package.json" ]; then
    echo "✅ 前端package.json存在"
else
    echo "❌ 前端package.json缺失"
fi

if [ -f "docker-compose.yml" ]; then
    echo "✅ Docker Compose配置存在"
else
    echo "❌ Docker Compose配置缺失"
fi

if [ -f "backend/.env" ]; then
    echo "✅ 后端环境变量文件存在"
else
    echo "⚠️  后端环境变量文件缺失（需要创建）"
fi

echo ""

# 检查MongoDB容器
echo "🗄️  MongoDB容器状态："
docker ps | grep -q "ai-hotspot-mongodb"
if [ $? -eq 0 ]; then
    echo "✅ MongoDB容器正在运行"
    echo "   管理界面: http://localhost:8081"
else
    echo "❌ MongoDB容器未运行"
    echo "   启动命令: docker-compose up -d mongodb"
fi

echo ""

# 检查端口占用
echo "🔌 端口状态："
netstat -ano 2>/dev/null | grep ":3000" > /dev/null
if [ $? -eq 0 ]; then
    echo "⚠️  端口3000已被占用"
else
    echo "✅ 端口3000可用"
fi

netstat -ano 2>/dev/null | grep ":5000" > /dev/null
if [ $? -eq 0 ]; then
    echo "⚠️  端口5000已被占用"
else
    echo "✅ 端口5000可用"
fi

netstat -ano 2>/dev/null | grep ":27017" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ 端口27017可用（MongoDB运行中）"
else
    echo "❌ 端口27017未使用（MongoDB未运行）"
fi

echo ""
echo "📋 启动建议："
echo ""
echo "方案1: 使用简化启动脚本"
echo "  Windows: 双击 start-easy.bat"
echo "  Linux/Mac: bash start.sh"
echo ""
echo "方案2: 手动启动"
echo "  1. 启动MongoDB:"
echo "     docker-compose up -d mongodb"
echo "  2. 配置环境变量:"
echo "     cd backend && cp .env.example .env"
echo "  3. 启动后端:"
echo "     cd backend && npm install && npm run dev"
echo "  4. 启动前端（新终端）:"
echo "     cd frontend && npm install && npm start"
echo ""
echo "方案3: 解决npm权限问题"
echo "  Windows: 以管理员身份运行PowerShell"
echo "  Linux/Mac: 使用sudo npm install"
echo ""
echo "🎯 访问地址："
echo "  前端界面: http://localhost:3000"
echo "  后端API: http://localhost:5000/health"
echo "  数据库管理: http://localhost:8081"
echo ""