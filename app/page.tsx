"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Eye, 
  Settings,
  BarChart3,
  PlayCircle,
  Radar,
  Activity,
  Zap
} from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/use-i18n"
import { Logo, RadarScan } from "@/components/ui/logo"

export default function HomePage() {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Logo size="lg" showText={false} animated={false} />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                YouTube Radar
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" />
                {t('dashboard.description', '实时监控您的 YouTube 频道活动')}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="border-gray-200 hover:bg-gray-50">
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            {t('common.settings', '设置')}
          </Link>
        </Button>
      </div>

      {/* 简单的欢迎卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-red-100 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              {t('dashboard.totalChannels', '监控频道')}
            </CardTitle>
            <Radar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">0</div>
            <Button variant="ghost" size="sm" className="mt-1 p-0 h-auto" asChild>
              <Link href="/channels" className="text-xs text-red-600 hover:text-red-800">
                {t('dashboard.addChannel', '添加频道')} →
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              {t('dashboard.totalViews', '总观看数')}
            </CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">0</div>
            <p className="text-xs text-blue-600">
              {t('dashboard.acrossAllChannels', '开始添加频道')}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              {t('dashboard.totalSubscribers', '订阅者')}
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">0</div>
            <p className="text-xs text-green-600">
              {t('dashboard.combinedSubscribers', '等待数据')}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              {t('dashboard.totalVideos', '视频数')}
            </CardTitle>
            <PlayCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">0</div>
            <p className="text-xs text-purple-600">
              {t('dashboard.publishedVideos', '准备就绪')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-red-100 bg-gradient-to-br from-red-50 via-white to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Zap className="h-5 w-5 text-red-600" />
              {t('dashboard.quickActions', '快速开始')}
            </CardTitle>
            <CardDescription className="text-red-600">
              {t('dashboard.commonTasks', '开始监控您的 YouTube 频道')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button className="justify-start hover:bg-red-50 border-red-200" variant="outline" asChild>
              <Link href="/channels">
                <Radar className="mr-2 h-4 w-4 text-red-600" />
                {t('dashboard.addChannel', '添加第一个频道')}
              </Link>
            </Button>
            <Button className="justify-start hover:bg-blue-50 border-blue-200" variant="outline" asChild>
              <Link href="/public-analytics">
                <BarChart3 className="mr-2 h-4 w-4 text-blue-600" />
                {t('dashboard.viewChannels', '公共分析工具')}
              </Link>
            </Button>
            <Button className="justify-start hover:bg-green-50 border-green-200" variant="outline" asChild>
              <Link href="/settings">
                <Activity className="mr-2 h-4 w-4 text-green-600" />
                {t('dashboard.viewDailyActivity', '系统设置')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <RadarScan className="text-blue-600" size={20} />
              {t('dashboard.recentChannels', '功能介绍')}
            </CardTitle>
            <CardDescription className="text-blue-600">
              {t('dashboard.recentlyUpdated', '了解 YouTube Radar 的功能')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5">1</Badge>
              <p className="text-sm">添加您想要监控的 YouTube 频道</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5">2</Badge>
              <p className="text-sm">实时查看频道数据和视频统计</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5">3</Badge>
              <p className="text-sm">分析频道增长趋势和表现</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5">4</Badge>
              <p className="text-sm">数据保存在本地，随时可用</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}