@echo off
echo === AI热点监控工具启动脚本 ===

echo 正在启动MongoDB容器...
docker-compose up -d mongodb
timeout /t 3 >/dev/null

echo.
echo 正在启动后端服务...
cd backend
if not exist "node_modules" npm install
start "后端服务" cmd /k "npm run dev"

echo.
echo 正在启动前端服务...
cd ..\frontend
if not exist "node_modules" npm install
start "前端服务" cmd /k "npm start"

echo.
echo === 启动完成 ===
echo 后端服务: http://localhost:5001
echo 前端服务: http://localhost:3000
echo.
pause
