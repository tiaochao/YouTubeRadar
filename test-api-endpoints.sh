#!/bin/bash

# API 端点测试脚本
# 基础 URL
BASE_URL="http://localhost:3001/api"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 测试结果存储
declare -A test_results

# 测试函数
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing [$method] $endpoint... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    if [[ $response =~ ^[2-3][0-9][0-9]$ ]]; then
        echo -e "${GREEN}✓ $response${NC}"
        test_results["$method $endpoint"]="PASS ($response)"
    else
        echo -e "${RED}✗ $response${NC}"
        test_results["$method $endpoint"]="FAIL ($response)"
    fi
}

echo "========================================="
echo "YouTube Analytics Dashboard API 测试"
echo "========================================="
echo ""

# 基础端点测试
echo "== 基础端点 =="
test_endpoint "GET" "/videos" "" "获取视频列表"
test_endpoint "GET" "/channels" "" "获取频道列表"
test_endpoint "GET" "/analytics" "" "获取分析数据"
test_endpoint "GET" "/daily-activity" "" "获取每日活动"
test_endpoint "GET" "/tasks" "" "获取任务列表"
test_endpoint "GET" "/export" "" "导出数据"

echo ""
echo "== 配置端点 =="
test_endpoint "GET" "/config" "" "获取配置"
test_endpoint "GET" "/system-config" "" "获取系统配置"
test_endpoint "POST" "/system-config" '{"timezone":"Asia/Shanghai"}' "更新系统配置"

echo ""
echo "== 调试端点 =="
test_endpoint "GET" "/debug-locks" "" "获取锁状态"
test_endpoint "POST" "/reset-locks" "" "重置锁"
test_endpoint "POST" "/clear-locks" "" "清除锁"

echo ""
echo "== 频道管理端点 =="
test_endpoint "POST" "/channels/add-public" '{"channelId":"UCtest123"}' "添加公共频道"
test_endpoint "POST" "/channels/sync-all" "" "同步所有频道"
test_endpoint "POST" "/channels/sync-all-stats" "" "同步所有频道统计"

echo ""
echo "== YouTube API 端点 =="
test_endpoint "GET" "/youtube/channel?channelId=UCtest123" "" "获取YouTube频道信息"

echo ""
echo "== 管理员端点 =="
test_endpoint "GET" "/admin/config" "" "获取管理员配置"
test_endpoint "POST" "/admin/cleanup" "" "清理数据"
test_endpoint "POST" "/admin/generate-all-daily-stats" "" "生成所有每日统计"

echo ""
echo "== 开发端点 =="
test_endpoint "GET" "/dev/test-setup" "" "测试设置"
test_endpoint "POST" "/dev/add-test-channel" "" "添加测试频道"

echo ""
echo "== Cron 任务端点 =="
test_endpoint "POST" "/cron/run" '{"task":"sync"}' "运行定时任务"
test_endpoint "POST" "/cron/sync-all-channels" "" "同步所有频道（定时任务）"
test_endpoint "POST" "/cron/daily-analytics" "" "每日分析（定时任务）"
test_endpoint "POST" "/cron/refresh-channel-metrics" "" "刷新频道指标"
test_endpoint "POST" "/cron/refresh-video-stats" "" "刷新视频统计"

echo ""
echo "== 动态路由端点（示例频道ID: UCtest123）=="
test_endpoint "GET" "/channels/UCtest123" "" "获取特定频道"
test_endpoint "DELETE" "/channels/UCtest123" "" "删除特定频道"
test_endpoint "PATCH" "/channels/UCtest123" '{"name":"Updated Name"}' "更新特定频道"
test_endpoint "GET" "/channels/UCtest123/videos" "" "获取频道视频"
test_endpoint "GET" "/channels/UCtest123/daily-stats" "" "获取频道每日统计"
test_endpoint "POST" "/channels/UCtest123/sync" "" "同步特定频道"
test_endpoint "POST" "/channels/UCtest123/sync-stats" "" "同步频道统计"
test_endpoint "POST" "/channels/UCtest123/generate-daily-stats" "" "生成频道每日统计"

echo ""
echo "========================================="
echo "测试汇总报告"
echo "========================================="
echo ""

# 统计结果
pass_count=0
fail_count=0

for endpoint in "${!test_results[@]}"; do
    result="${test_results[$endpoint]}"
    if [[ $result == PASS* ]]; then
        ((pass_count++))
    else
        ((fail_count++))
    fi
done

echo "总计测试: $((pass_count + fail_count)) 个端点"
echo -e "${GREEN}通过: $pass_count${NC}"
echo -e "${RED}失败: $fail_count${NC}"

echo ""
echo "详细结果:"
echo "---------"
for endpoint in "${!test_results[@]}"; do
    result="${test_results[$endpoint]}"
    if [[ $result == PASS* ]]; then
        echo -e "${GREEN}✓ $endpoint - $result${NC}"
    else
        echo -e "${RED}✗ $endpoint - $result${NC}"
    fi
done | sort