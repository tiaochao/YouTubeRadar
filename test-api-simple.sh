#!/bin/bash

# API 端点测试脚本（简化版）
BASE_URL="http://localhost:3001/api"

echo "========================================="
echo "YouTube Analytics Dashboard API 测试报告"
echo "========================================="
echo ""

# 测试结果文件
echo "端点,方法,状态码,结果" > test_results.csv

# 测试函数
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    printf "%-50s" "[$method] $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    if [[ $response =~ ^[2-3][0-9][0-9]$ ]]; then
        echo "✓ $response"
        echo "$endpoint,$method,$response,PASS" >> test_results.csv
    else
        echo "✗ $response"
        echo "$endpoint,$method,$response,FAIL" >> test_results.csv
    fi
}

# 基础端点
echo "=== 基础端点 ==="
test_endpoint "GET" "/videos"
test_endpoint "GET" "/channels"
test_endpoint "GET" "/analytics"
test_endpoint "GET" "/daily-activity"
test_endpoint "GET" "/tasks"
test_endpoint "GET" "/export"

echo ""
echo "=== 配置端点 ==="
test_endpoint "GET" "/config"
test_endpoint "GET" "/system-config"
test_endpoint "POST" "/system-config" '{"timezone":"Asia/Shanghai"}'

echo ""
echo "=== 调试端点 ==="
test_endpoint "GET" "/debug-locks"
test_endpoint "POST" "/reset-locks"
test_endpoint "POST" "/clear-locks"

echo ""
echo "=== 频道管理端点 ==="
test_endpoint "POST" "/channels/add-public" '{"channelId":"UCtest123"}'
test_endpoint "POST" "/channels/sync-all"
test_endpoint "POST" "/channels/sync-all-stats"

echo ""
echo "=== YouTube API 端点 ==="
test_endpoint "GET" "/youtube/channel?channelId=UCtest123"

echo ""
echo "=== 管理员端点 ==="
test_endpoint "GET" "/admin/config"
test_endpoint "POST" "/admin/cleanup"
test_endpoint "POST" "/admin/generate-all-daily-stats"

echo ""
echo "=== 开发端点 ==="
test_endpoint "GET" "/dev/test-setup"
test_endpoint "POST" "/dev/add-test-channel"

echo ""
echo "=== Cron 任务端点 ==="
test_endpoint "POST" "/cron/run" '{"task":"sync"}'
test_endpoint "POST" "/cron/sync-all-channels"
test_endpoint "POST" "/cron/daily-analytics"
test_endpoint "POST" "/cron/refresh-channel-metrics"
test_endpoint "POST" "/cron/refresh-video-stats"

echo ""
echo "=== 动态路由端点（频道ID: UCtest123）==="
test_endpoint "GET" "/channels/UCtest123"
test_endpoint "DELETE" "/channels/UCtest123"
test_endpoint "PATCH" "/channels/UCtest123" '{"name":"Updated Name"}'
test_endpoint "GET" "/channels/UCtest123/videos"
test_endpoint "GET" "/channels/UCtest123/daily-stats"
test_endpoint "POST" "/channels/UCtest123/sync"
test_endpoint "POST" "/channels/UCtest123/sync-stats"
test_endpoint "POST" "/channels/UCtest123/generate-daily-stats"

echo ""
echo "========================================="
echo "测试汇总"
echo "========================================="

# 统计结果
total=$(grep -c "," test_results.csv | head -1)
pass=$(grep -c "PASS" test_results.csv)
fail=$(grep -c "FAIL" test_results.csv)

echo "总计测试: $((total - 1)) 个端点"
echo "通过: $pass"
echo "失败: $fail"
echo ""
echo "详细结果已保存到: test_results.csv"