#!/bin/bash

# AI热点监控系统 - Git Bash环境安装和测试脚本

echo "========================================="
echo "  AI热点监控系统 - 快速测试"
echo "========================================="
echo ""

PROJECT_DIR="/d/Claude code/ai-hotspot-monitor"
cd "$PROJECT_DIR" || exit 1

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 检查ws模块
echo -e "${BLUE}📦 检查WebSocket模块...${NC}"
if [ -d "backend/node_modules/ws" ]; then
    echo -e "${GREEN}✅ ws模块已安装${NC}"
else
    echo -e "${RED}❌ ws模块未安装${NC}"
    echo ""
    echo "请手动执行以下命令安装ws模块："
    echo ""
    echo "  cd backend"
    echo "  npm install ws --save"
    echo ""
    echo "或者使用以下方法："
    echo ""
    echo "  方法1 - 清除缓存后安装:"
    echo "  npm cache clean --force"
    echo "  npm install ws"
    echo ""
    echo "  方法2 - 使用管理员权限:"
    echo "  以管理员身份运行Git Bash，然后执行:"
    echo "  cd backend && npm install ws"
    echo ""
    read -p "安装完成后按回车继续..."
fi
echo ""

# 2. 检查后端服务
echo -e "${BLUE}📡 检查后端服务...${NC}"
BACKEND_CHECK=$(curl -s http://localhost:5001/health 2>/dev/null)
if [ -n "$BACKEND_CHECK" ]; then
    echo -e "${GREEN}✅ 后端服务运行中${NC}"
    echo "   $BACKEND_CHECK"
else
    echo -e "${RED}❌ 后端服务未运行${NC}"
    echo "   请执行: cd backend && node server.js"
fi
echo ""

# 3. 检查前端服务
echo -e "${BLUE}🌐 检查前端服务...${NC}"
FRONTEND_CHECK=$(curl -s http://localhost:3000 2>/dev/null | head -1)
if [ -n "$FRONTEND_CHECK" ]; then
    echo -e "${GREEN}✅ 前端服务运行中${NC}"
else
    echo -e "${YELLOW}⚠️  前端服务未运行${NC}"
    echo "   请执行: cd frontend && npm start"
fi
echo ""

# 4. 检查关键文件
echo -e "${BLUE}📄 检查关键文件...${NC}"
FILES=(
    "backend/src/models/ScanTask.js"
    "backend/src/services/websocket.service.js"
    "backend/src/services/asyncScan.service.js"
    "backend/src/utils/uuid.js"
    "frontend/src/types/websocket.ts"
    "frontend/src/utils/websocketClient.ts"
    "frontend/src/pages/AsyncScanDashboard.tsx"
)

ALL_EXIST=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file (缺失)"
        ALL_EXIST=false
    fi
done
echo ""

# 5. 检查MongoDB
echo -e "${BLUE}🗄️  检查MongoDB...${NC}"
if docker ps | grep -q "ai-hotspot-mongodb"; then
    echo -e "${GREEN}✅ MongoDB容器运行中${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB容器未运行${NC}"
    echo "   请执行: docker run -d --name ai-hotspot-mongodb -p 27017:27017 mongo:latest"
fi
echo ""

# 6. 测试API接口
echo -e "${BLUE}🧪 测试API接口...${NC}"
echo "测试健康检查..."
HEALTH_RESPONSE=$(curl -s http://localhost:5001/health)
echo "响应: $HEALTH_RESPONSE"
echo ""

# 7. 显示下一步操作
echo "========================================="
echo "  测试指南"
echo "========================================="
echo ""
echo -e "${GREEN}1. 测试步骤:${NC}"
echo "   a) 安装ws模块 (如果未安装)"
echo "   b) 重启后端服务"
echo "   c) 启动前端服务"
echo "   d) 访问 http://localhost:3000"
echo ""
echo -e "${GREEN}2. 登录信息:${NC}"
echo "   邮箱: admin@example.com"
echo "   密码: admin123"
echo ""
echo -e "${GREEN}3. 功能测试:${NC}"
echo "   a) 添加关键词 (AI、编程等)"
echo "   b) 点击'启动扫描'"
echo "   c) 打开浏览器控制台 (F12) 查看WebSocket消息"
echo "   d) 观察实时AI分析结果"
echo ""
echo -e "${GREEN}4. 验证结果:${NC}"
echo "   - 扫描应在5秒内返回响应"
echo "   - 收到WebSocket实时通知"
echo "   - confidence字段正确返回 (0-100)"
echo "   - verification.status正确设置"
echo ""
echo -e "${YELLOW}⚠️  注意事项:${NC}"
echo "   - 确保后端启动日志包含'WebSocket服务器已初始化'"
echo "   - 确保API密钥已配置 (.env文件)"
echo "   - 保持浏览器控制台打开以查看WebSocket消息"
echo ""
