# AI热点监控系统 - 状态检查工具 (PowerShell)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  AI热点监控系统 - 状态检查工具" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查后端服务
Write-Host "📡 检查后端服务..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/health" -UseBasicParsing -TimeoutSec 2
    Write-Host "✅ 后端服务运行中 (端口 5001)" -ForegroundColor Green
    Write-Host "   状态: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ 后端服务未运行" -ForegroundColor Red
    Write-Host "   请执行: cd backend && node server.js" -ForegroundColor Gray
}
Write-Host ""

# 2. 检查WebSocket模块
Write-Host "📦 检查WebSocket模块..." -ForegroundColor Yellow
$wsPath = "D:\Claude code\ai-hotspot-monitor\backend\node_modules\ws"
if (Test-Path $wsPath) {
    Write-Host "✅ ws模块已安装" -ForegroundColor Green
} else {
    Write-Host "❌ ws模块未安装" -ForegroundColor Red
    Write-Host "   请执行: cd backend && npm install ws --save" -ForegroundColor Gray
}
Write-Host ""

# 3. 检查前端服务
Write-Host "🌐 检查前端服务..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2
    Write-Host "✅ 前端服务运行中 (端口 3000)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  前端服务未运行 (端口 3000)" -ForegroundColor Yellow
    Write-Host "   请执行: cd frontend && npm start" -ForegroundColor Gray
}
Write-Host ""

# 4. 检查类型定义文件
Write-Host "📝 检查TypeScript类型定义..." -ForegroundColor Yellow
$typeFile = "D:\Claude code\ai-hotspot-monitor\frontend\src\types\websocket.ts"
if (Test-Path $typeFile) {
    Write-Host "✅ 类型定义文件存在: src/types/websocket.ts" -ForegroundColor Green
} else {
    Write-Host "❌ 类型定义文件缺失" -ForegroundColor Red
}
Write-Host ""

# 5. 检查关键文件
Write-Host "📄 检查关键文件..." -ForegroundColor Yellow
$files = @(
    "backend\src\models\ScanTask.js",
    "backend\src\services\websocket.service.js",
    "backend\src\services\asyncScan.service.js",
    "backend\src\utils\uuid.js",
    "frontend\src\utils\websocketClient.ts",
    "frontend\src\types\websocket.ts",
    "frontend\src\pages\AsyncScanDashboard.tsx"
)

$baseDir = "D:\Claude code\ai-hotspot-monitor"
$missing = 0

foreach ($file in $files) {
    $fullPath = Join-Path $baseDir $file
    if (Test-Path $fullPath) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (缺失)" -ForegroundColor Red
        $missing++
    }
}
Write-Host ""

# 6. 检查MongoDB
Write-Host "🗄️  检查MongoDB..." -ForegroundColor Yellow
try {
    $mongoProcess = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
    if ($mongoProcess) {
        Write-Host "✅ MongoDB进程运行中" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB进程未找到" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  无法检查MongoDB状态" -ForegroundColor Yellow
}
Write-Host ""

# 7. 环境变量检查
Write-Host "🔑 检查环境变量..." -ForegroundColor Yellow
$envFile = "D:\Claude code\ai-hotspot-monitor\backend\.env"
if (Test-Path $envFile) {
    Write-Host "✅ .env文件存在" -ForegroundColor Green
    
    # 读取AI配置
    $envContent = Get-Content $envFile
    $aiProvider = ($envContent | Select-String "AI_SERVICE_PROVIDER=" | Select-Object -First 1)
    if ($aiProvider) {
        Write-Host "   AI服务提供商: $($aiProvider.Line.Split('=')[1])" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ .env文件不存在" -ForegroundColor Red
}
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  检查完成" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 后续步骤:" -ForegroundColor Cyan
Write-Host "1. 如果ws模块未安装，请手动安装" -ForegroundColor White
Write-Host "2. 如果前端未运行，请启动前端" -ForegroundColor White
Write-Host "3. 访问 http://localhost:3000 测试功能" -ForegroundColor White
Write-Host ""
