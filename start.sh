#!/bin/bash
# AI热点监控工具 - 启动脚本

echo "=== AI热点监控工具启动脚本 ==="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装，请先安装Docker"
    exit 1
fi

# 启动MongoDB容器
echo "正在启动MongoDB容器..."
docker-compose up -d mongodb

# 等待MongoDB启动
echo "等待MongoDB启动..."
sleep 5

# 检查MongoDB是否启动成功
if docker ps | grep -q "ai-hotspot-mongodb"; then
    echo "✓ MongoDB容器启动成功"
    echo "  MongoDB管理界面: http://localhost:8081"
    echo "  用户名: admin, 密码: admin123"
else
    echo "✗ MongoDB容器启动失败"
    exit 1
fi

# 启动后端服务
echo ""
echo "正在启动后端服务..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "正在安装后端依赖..."
    npm install
fi
npm run dev &
BACKEND_PID=$!
echo "✓ 后端服务已启动 (PID: $BACKEND_PID)"

# 启动前端服务
echo ""
echo "正在启动前端服务..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "正在安装前端依赖..."
    npm install
fi
npm start &
FRONTEND_PID=$!
echo "✓ 前端服务已启动 (PID: $FRONTEND_PID)"

echo ""
echo "=== 启动完成 ==="
echo "后端服务: http://localhost:5001"
echo "前端服务: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose down; exit 0" INT

wait
