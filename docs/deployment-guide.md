# AI热点监控工具 - 部署指南

## 前端部署

### 构建前端

```bash
cd frontend
npm install
npm run build
```

### Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
        index index.html;

        # SPA路由支持
        location / {
            try_files $uri $uri/ /index.html;
        }
    }

    # API代理到后端
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_no_cache 1;
    }
}
```

## 后端部署

### PM2进程管理

```bash
# 安装PM2
npm install -g pm2

# 启动后端
cd backend
pm2 start ai-hotspot-monitor-backend --name "ai-hotspot-backend"

# 查看日志
pm2 logs ai-hotspot-monitor-backend

# 停止服务
pm2 stop ai-hotspot-monitor-backend

# 重启服务
pm2 restart ai-hotspot-monitor-backend
```

### PM2配置文件

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ai-hotspot-monitor-backend',
    script: './backend/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/app-error.log',
    out_file: './logs/app-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

## Docker部署

### Docker Compose配置

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/ai-hotspot-monitor
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongodb_data:
```

### 构建和启动

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重新构建
docker-compose up -d --build
```

## 环境变量配置

### 生产环境配置

```bash
# 后端环境变量
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://user:password@mongodb-host:27017/ai-hotspot-monitor

# JWT配置
JWT_SECRET=your-production-secret-key
JWT_EXPIRE=24h

# OpenRouter API配置
OPENROUTER_API_KEY=your-production-api-key
OPENROUTER_REFERER=https://your-domain.com
OPENROUTER_TITLE=AI Hotspot Monitor

# 邮件配置
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=notifications@your-domain.com
SMTP_PASS=your-email-password

# 爬虫配置
CRAWLER_INTERVAL=30m
MAX_CRAWL_THREADS=5
CRAWLER_TIMEOUT=30000

# Web推送配置
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

## 监控和日志

### 日志配置

```javascript
// backend/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
```

### 健康检查端点

```javascript
// backend/routes/health.routes.js
const router = express.Router();

router.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };
  res.json(health);
});

module.exports = router;
```

## 性能优化

### Node.js性能

```javascript
// 启用集群模式
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
}
```

### MongoDB优化

```javascript
// 数据库连接池
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  poolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  useNewUrlParser: true,
  useUnifiedTopology: true
});
```

## 安全配置

### HTTPS配置

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 强制HTTPS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
```

### 防火墙配置

```bash
# Ubuntu UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw enable
```

## 备份策略

### 数据库备份

```bash
# MongoDB备份脚本
mongodump --db ai-hotspot-monitor --out /backups/backup-$(date +%Y%m%d).tar.gz

# 恢复备份
mongorestore --db ai-hotspot-monitor /backups/backup-20240101.tar.gz
```

### 自动备份

```javascript
// 定时备份脚本
const cron = require('node-cron');

cron.schedule('0 2 * * *', async () => {
  await backupDatabase();
});
```

## 监控和告警

### 应用监控

```bash
# 监控服务器资源
top -b -n 1 | head -n 1

# 监控磁盘使用
df -h

# 监控内存使用
free -m
```

### 日志监控

```bash
# 监控错误日志
tail -f backend/logs/error.log | grep ERROR

# 监控访问日志
tail -f nginx/access.log
```

## 常见问题

### Q: 部署后无法访问
A: 检查防火墙规则、DNS配置、SSL证书有效性

### Q: 数据库连接失败
A: 确认MongoDB服务状态、连接字符串正确性、网络连通性

### Q: 内存占用过高
A: 调整Node.js内存限制、启用数据库连接池、实施缓存策略

### Q: 响应速度慢
A: 启用CDN、优化数据库查询、实施缓存机制、使用集群模式

## 运维检查清单

- [ ] 环境变量配置正确
- [ ] 数据库连接正常
- [ ] API服务访问正常
- [ ] 邮件服务配置有效
- [ ] 防火墙规则正确
- [ ] SSL证书有效
- [ ] 日志目录权限正确
- [ ] 备份策略配置
- [ ] 监控告警配置
- [ ] 性能优化措施
- [ ] 健康检查端点可访问
- [ ] 回滚方案准备

## 回滚方案

### 数据库回滚

```bash
# 停止应用
pm2 stop ai-hotspot-monitor-backend

# 恢复数据库
mongorestore --db ai-hotspot-monitor /backups/latest-backup.tar.gz

# 启动应用
pm2 start ai-hotspot-monitor-backend
```

### 代码回滚

```bash
# Git回滚
git log --oneline -10
git checkout [commit-hash]

# 或使用特定版本
git checkout v1.0.0
```

---

🔥 按照此指南完成部署，确保系统稳定运行！