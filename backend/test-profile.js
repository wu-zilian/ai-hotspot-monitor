#!/bin/bash

# AI热点监控系统 - 个人中心功能测试脚本
# 测试日期: 2026-04-11

BASE_URL="http://localhost:5001"
TOKEN=""

echo "======================================"
echo "AI热点监控系统 - 个人中心功能测试"
echo "======================================"
echo ""

# 1. 测试用户注册
echo "【测试1】用户注册"
echo "-----------------------------------"
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"profiletest","email":"profiletest@example.com","password":"Test123456"}')
echo "$REGISTER_RESPONSE"
echo ""

# 提取token
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ 注册失败，无法获取token"
    echo "尝试使用已有账号登录..."
    LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"profiletest@example.com","password":"Test123456"}')
    echo "$LOGIN_RESPONSE"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo "❌ 无法获取token，测试终止"
    exit 1
fi

echo "✅ Token获取成功: ${TOKEN:0:20}..."
echo ""

# 2. 测试获取用户信息
echo "【测试2】获取用户信息 (GET /api/auth/me)"
echo "-----------------------------------"
curl -s -X GET ${BASE_URL}/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# 3. 测试获取用户详细信息（个人中心）
echo "【测试3】获取用户详细信息 (GET /api/auth/profile)"
echo "-----------------------------------"
curl -s -X GET ${BASE_URL}/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# 4. 测试更新用户信息
echo "【测试4】更新用户信息 (PUT /api/auth/profile)"
echo "-----------------------------------"
curl -s -X PUT ${BASE_URL}/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"profiletest_updated"}'
echo ""
echo ""

# 5. 测试修改密码 - 正确的当前密码
echo "【测试5】修改密码 - 正确的当前密码 (POST /api/auth/change-password)"
echo "-----------------------------------"
curl -s -X POST ${BASE_URL}/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"Test123456","newPassword":"NewPass123"}'
echo ""
echo ""

# 6. 测试修改密码 - 错误的当前密码
echo "【测试6】修改密码 - 错误的当前密码"
echo "-----------------------------------"
curl -s -X POST ${BASE_URL}/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"WrongPassword","newPassword":"NewPass123"}'
echo ""
echo ""

# 7. 测试修改密码 - 密码太短
echo "【测试7】修改密码 - 新密码太短（少于6位）"
echo "-----------------------------------"
curl -s -X POST ${BASE_URL}/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"NewPass123","newPassword":"12345"}'
echo ""
echo ""

# 8. 测试未授权访问
echo "【测试8】未授权访问（无token）"
echo "-----------------------------------"
curl -s -X GET ${BASE_URL}/api/auth/profile
echo ""
echo ""

# 9. 测试无效token访问
echo "【测试9】无效token访问"
echo "-----------------------------------"
curl -s -X GET ${BASE_URL}/api/auth/profile \
  -H "Authorization: Bearer invalid_token_here"
echo ""
echo ""

# 10. 测试退出登录
echo "【测试10】退出登录 (POST /api/auth/logout)"
echo "-----------------------------------"
curl -s -X POST ${BASE_URL}/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# 11. 测试用新密码重新登录
echo "【测试11】用新密码重新登录"
echo "-----------------------------------"
curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"profiletest@example.com","password":"NewPass123"}'
echo ""
echo ""

echo "======================================"
echo "测试完成"
echo "======================================"