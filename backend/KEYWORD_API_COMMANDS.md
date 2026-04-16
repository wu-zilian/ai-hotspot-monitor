# 关键词管理API测试命令集合

## 基础信息
- **服务器地址**: http://localhost:5001
- **API端点**: /api/keywords
- **认证方式**: JWT Bearer Token

## 1. 获取认证Token
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**响应示例**:
```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "69d7235573ee40663e229954",
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

## 2. 获取关键词列表
```bash
curl -X GET http://localhost:5001/api/keywords \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**响应示例**:
```json
[
  {
    "_id": "69da4db91cd6f6fb9dc1bcf8",
    "userId": "69d7235573ee40663e229954",
    "name": "人工智能",
    "description": "AI技术热点",
    "isActive": true,
    "createdAt": "2026-04-11T13:33:45.689Z",
    "updatedAt": "2026-04-11T13:33:45.689Z"
  }
]
```

## 3. 添加新关键词
```bash
curl -X POST http://localhost:5001/api/keywords \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "人工智能",
    "description": "AI技术热点监控"
  }'
```

**请求参数**:
- `name` (必需): 关键词名称，1-100字符
- `description` (可选): 描述信息，最大500字符
- `isActive` (可选): 启用状态，默认true

## 4. 获取单个关键词详情
```bash
curl -X GET http://localhost:5001/api/keywords/KEYWORD_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 5. 更新关键词
```bash
curl -X PUT http://localhost:5001/api/keywords/KEYWORD_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "人工智能技术",
    "description": "AI与机器学习热点监控",
    "isActive": true
  }'
```

## 6. 删除关键词
```bash
curl -X DELETE http://localhost:5001/api/keywords/KEYWORD_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 7. 切换关键词状态
```bash
# 禁用关键词
curl -X PUT http://localhost:5001/api/keywords/KEYWORD_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'

# 启用关键词
curl -X PUT http://localhost:5001/api/keywords/KEYWORD_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}'
```

## 完整测试流程

### Step 1: 登录获取Token
```bash
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

### Step 2: 查看现有关键词
```bash
curl -s -X GET http://localhost:5001/api/keywords \
  -H "Authorization: Bearer $TOKEN" \
  | python -m json.tool
```

### Step 3: 添加测试关键词
```bash
curl -s -X POST http://localhost:5001/api/keywords \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试关键词","description":"这是一个测试"}' \
  | python -m json.tool
```

### Step 4: 更新关键词
```bash
# 首先获取关键词ID
KEYWORD_ID=$(curl -s -X GET "http://localhost:5001/api/keywords" \
  -H "Authorization: Bearer $TOKEN" \
  | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 更新关键词
curl -s -X PUT "http://localhost:5001/api/keywords/$KEYWORD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"更新后的关键词","description":"已更新"}' \
  | python -m json.tool
```

### Step 5: 删除关键词
```bash
curl -s -X DELETE "http://localhost:5001/api/keywords/$KEYWORD_ID" \
  -H "Authorization: Bearer $TOKEN"
```

## 错误处理测试

### 测试空关键词名称
```bash
curl -X POST http://localhost:5001/api/keywords \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"","description":"测试"}'
```

### 测试重复关键词
```bash
curl -X POST http://localhost:5001/api/keywords \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"人工智能","description":"重复测试"}'
```

### 测试无效Token
```bash
curl -X GET http://localhost:5001/api/keywords \
  -H "Authorization: Bearer invalid_token"
```

### 测试不存在的关键词
```bash
curl -X GET http://localhost:5001/api/keywords/000000000000000000000000 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 响应状态码说明

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | GET、PUT请求成功 |
| 201 | Created | POST创建成功 |
| 400 | Bad Request | 参数验证失败 |
| 401 | Unauthorized | Token无效或过期 |
| 404 | Not Found | 关键词不存在 |
| 500 | Internal Server Error | 服务器内部错误 |

## 快速测试脚本

```bash
#!/bin/bash

# 配置
API_BASE="http://localhost:5001/api/keywords"
AUTH_URL="http://localhost:5001/api/auth/login"

# 登录
echo "正在登录..."
RESPONSE=$(curl -s -X POST "$AUTH_URL" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"

# 获取关键词列表
echo -e "\n获取关键词列表..."
curl -s -X GET "$API_BASE" \
  -H "Authorization: Bearer $TOKEN" \
  | python -m json.tool

# 添加关键词
echo -e "\n添加关键词..."
curl -s -X POST "$API_BASE" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"快速测试","description":"快速测试关键词"}' \
  | python -m json.tool

# 再次获取列表
echo -e "\n更新后的列表..."
curl -s -X GET "$API_BASE" \
  -H "Authorization: Bearer $TOKEN" \
  | python -m json.tool
```

## 注意事项

1. 所有请求都需要在Header中包含有效的JWT Token
2. 关键词名称在同一用户下不能重复
3. 关键词名称不能为空
4. 用户只能管理自己创建的关键词
5. 删除操作是不可逆的