#!/bin/bash

# ws模块安装脚本 - Git Bash环境

echo "=== ws模块安装工具 ==="
echo ""

PROJECT_DIR="/d/Claude code/ai-hotspot-monitor"
cd "$PROJECT_DIR/backend" || exit 1

echo "当前目录: $(pwd)"
echo ""

# 检查是否已安装
if [ -d "node_modules/ws" ]; then
    echo "✅ ws模块已安装，无需重复安装"
    echo ""
    echo "如需重新安装，请先删除:"
    echo "  rm -rf node_modules/ws"
    exit 0
fi

echo "开始安装ws模块..."
echo ""

# 方法1: 直接安装
echo "方法1: 直接安装"
npm install ws --save

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 安装成功！"
    echo ""
    echo "请重启后端服务:"
    echo "  1. 停止当前后端 (Ctrl+C)"
    echo "  2. cd backend && node server.js"
    exit 0
fi

echo ""
echo "直接安装失败，尝试其他方法..."

# 方法2: 清除缓存后安装
echo ""
echo "方法2: 清除缓存后安装"
npm cache clean --force
npm install ws

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 安装成功！"
    exit 0
fi

echo ""
echo "❌ 自动安装失败"
echo ""
echo "请手动执行以下操作:"
echo ""
echo "1. 关闭所有IDE和编辑器"
echo "2. 以管理员身份运行Git Bash"
echo "3. 执行以下命令:"
echo ""
echo "   cd $PROJECT_DIR/backend"
echo "   npm install ws --save"
echo ""
