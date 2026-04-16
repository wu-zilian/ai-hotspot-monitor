#!/bin/bash

# AI热点监控系统 - 关键词管理功能测试脚本
# 使用curl命令测试所有关键词管理API端点

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

API_BASE="http://localhost:5001/api/keywords"
AUTH_URL="http://localhost:5001/api/auth/login"
TOKEN=""

# 打印函数
print_header() {
    echo ""
    echo "============================================================"
    echo -e "${CYAN}测试: $1${NC}"
    echo "============================================================"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 运行测试函数
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_header "$test_name"

    result=$(eval "$command" 2>&1)
    exit_code=$?

    if [ $exit_code -eq 0 ]; then
        if [ -n "$expected_pattern" ]; then
            if echo "$result" | grep -q "$expected_pattern"; then
                print_success "$test_name 成功"
                PASSED_TESTS=$((PASSED_TESTS + 1))
                return 0
            else
                print_error "$test_name 失败 - 未找到预期结果: $expected_pattern"
                echo "响应: $result"
                FAILED_TESTS=$((FAILED_TESTS + 1))
                return 1
            fi
        else
            print_success "$test_name 成功"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            return 0
        fi
    else
        print_error "$test_name 失败 - HTTP状态码: $exit_code"
        echo "响应: $result"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo -e "${YELLOW}🚀 AI热点监控系统 - 关键词管理功能测试${NC}"
echo -e "${BLUE}API地址: $API_BASE${NC}"
echo -e "${BLUE}测试时间: $(date '+%Y/%m/%d %H:%M:%S')${NC}"

# ============================================
# 1. 登录获取Token
# ============================================
print_header "登录系统"
LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    print_success "登录成功"
    print_info "Token: ${TOKEN:0:20}..."
else
    print_error "登录失败"
    echo "响应: $LOGIN_RESPONSE"
    exit 1
fi

# ============================================
# 2. 测试GET /api/keywords - 获取关键词列表
# ============================================
run_test "获取关键词列表" \
    "curl -s -X GET '$API_BASE' -H 'Authorization: Bearer $TOKEN'" \
    ""

# ============================================
# 3. 测试POST /api/keywords - 添加关键词
# ============================================
print_header "添加新关键词"

# 测试添加多个关键词
KEYWORDS=(
    '{"name":"人工智能","description":"AI技术热点"}'
    '{"name":"机器学习","description":"ML技术发展"}'
    '{"name":"区块链","description":"区块链应用"}'
    '{"name":"云计算","description":"云计算服务"}'
)

CREATED_IDS=()

for kw in "${KEYWORDS[@]}"; do
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    response=$(curl -s -X POST "$API_BASE" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$kw")

    if echo "$response" | grep -q "_id"; then
        id=$(echo "$response" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
        name=$(echo "$kw" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        print_success "添加关键词 '$name' 成功 (ID: $id)"
        CREATED_IDS+=("$id")
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        name=$(echo "$kw" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        print_error "添加关键词 '$name' 失败"
        echo "响应: $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
done

# ============================================
# 4. 测试GET /api/keywords - 验证关键词已创建
# ============================================
run_test "验证关键词已创建" \
    "curl -s -X GET '$API_BASE' -H 'Authorization: Bearer $TOKEN'" \
    "人工智能"

# ============================================
# 5. 测试GET /api/keywords/:id - 获取单个关键词
# ============================================
if [ ${#CREATED_IDS[@]} -gt 0 ]; then
    FIRST_ID=${CREATED_IDS[0]}
    run_test "获取单个关键词详情" \
        "curl -s -X GET '$API_BASE/$FIRST_ID' -H 'Authorization: Bearer $TOKEN'" \
        "人工智能"
fi

# ============================================
# 6. 测试PUT /api/keywords/:id - 更新关键词
# ============================================
if [ ${#CREATED_IDS[@]} -gt 0 ]; then
    FIRST_ID=${CREATED_IDS[0]}
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_header "更新关键词"

    # 先获取当前状态
    current_status=$(curl -s -X GET "$API_BASE/$FIRST_ID" \
        -H "Authorization: Bearer $TOKEN" \
        | grep -o '"isActive":[^,}]*' | cut -d':' -f2)

    print_info "当前状态: $current_status"

    # 更新关键词
    response=$(curl -s -X PUT "$API_BASE/$FIRST_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"人工智能技术","description":"AI与机器学习热点监控","isActive":true}')

    if echo "$response" | grep -q "人工智能技术"; then
        print_success "更新关键词成功"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "更新关键词失败"
        echo "响应: $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

# ============================================
# 7. 测试参数验证 - 空关键词
# ============================================
TOTAL_TESTS=$((TOTAL_TESTS + 1))
print_header "参数验证 - 空关键词"

response=$(curl -s -X POST "$API_BASE" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"","description":"测试"}')

if echo "$response" | grep -q -E "(error|fail|require|valid)" || [ $? -ne 0 ]; then
    print_success "正确拒绝了空关键词"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "应该拒绝空关键词"
    echo "响应: $response"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# ============================================
# 8. 测试参数验证 - 重复关键词
# ============================================
TOTAL_TESTS=$((TOTAL_TESTS + 1))
print_header "参数验证 - 重复关键词"

# 尝试创建重复关键词
response=$(curl -s -X POST "$API_BASE" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"人工智能","description":"重复测试"}')

if echo "$response" | grep -q -E "(存在|exist|duplicate)" || [ $? -ne 0 ]; then
    print_success "正确拒绝了重复关键词"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "应该拒绝重复关键词"
    echo "响应: $response"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# ============================================
# 9. 测试DELETE /api/keywords/:id - 删除关键词
# ============================================
if [ ${#CREATED_IDS[@]} -gt 1 ]; then
    SECOND_ID=${CREATED_IDS[1]}
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_header "删除关键词"

    # 执行删除
    response=$(curl -s -X DELETE "$API_BASE/$SECOND_ID" \
        -H "Authorization: Bearer $TOKEN")

    # 验证删除
    verify_response=$(curl -s -X GET "$API_BASE/$SECOND_ID" \
        -H "Authorization: Bearer $TOKEN")

    if echo "$verify_response" | grep -q -E "(not found|不存在|404)"; then
        print_success "删除关键词成功并验证"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "删除验证失败"
        echo "响应: $verify_response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

# ============================================
# 10. 最终状态检查
# ============================================
print_header "最终状态检查"
FINAL_LIST=$(curl -s -X GET "$API_BASE" -H "Authorization: Bearer $TOKEN")
KEYWORD_COUNT=$(echo "$FINAL_LIST" | grep -o '"_id"' | wc -l)
print_success "当前关键词总数: $KEYWORD_COUNT"

# 显示关键词列表
echo ""
echo -e "${BLUE}当前关键词列表:${NC}"
echo "$FINAL_LIST" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | nl -w2 -s'. '

# ============================================
# 测试结果总结
# ============================================
echo ""
echo "============================================================"
echo -e "${YELLOW}📊 测试结果总结${NC}"
echo "============================================================"
echo -e "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  有 $FAILED_TESTS 个测试失败${NC}"
    exit 1
fi