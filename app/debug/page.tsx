'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Database,
  Key,
  Globe,
  Activity
} from 'lucide-react'

interface HealthCheck {
  status: string
  timestamp: string
  environment: string
  checks: {
    database: {
      status: string
      message: string
      hasUrl: boolean
      tables?: {
        channels: number
        videos: number
      }
      error?: any
    }
    youtube: {
      hasApiKey: boolean
      hasPublicApiKey: boolean
    }
    deployment: {
      platform: string
      region: string
    }
  }
}

export default function DebugPage() {
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealth(data)
    } catch (err: any) {
      setError(err.message || '无法连接到健康检查端点')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'error':
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'error':
      case 'unhealthy':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">检查系统状态...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!health) return null

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">系统诊断</h1>
          <p className="text-muted-foreground">检查应用程序配置和连接状态</p>
        </div>
        <Button onClick={fetchHealth} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {/* 总体状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            系统状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {getStatusIcon(health.status)}
            <div>
              <p className="font-medium">
                状态: <Badge className={getStatusColor(health.status)}>{health.status}</Badge>
              </p>
              <p className="text-sm text-muted-foreground">
                环境: {health.environment} | 平台: {health.checks.deployment.platform} | 
                更新时间: {new Date(health.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据库状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            数据库连接
          </CardTitle>
          <CardDescription>PostgreSQL 数据库连接状态</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {getStatusIcon(health.checks.database.status)}
            <span className="font-medium">
              {health.checks.database.status === 'connected' ? '已连接' : '连接失败'}
            </span>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">DATABASE_URL:</span>{' '}
              {health.checks.database.hasUrl ? (
                <Badge variant="secondary">已配置</Badge>
              ) : (
                <Badge variant="destructive">未配置</Badge>
              )}
            </p>
            
            <p className="text-sm">
              <span className="font-medium">消息:</span> {health.checks.database.message}
            </p>
            
            {health.checks.database.tables && (
              <div className="text-sm">
                <span className="font-medium">数据统计:</span>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>频道数: {health.checks.database.tables.channels}</li>
                  <li>视频数: {health.checks.database.tables.videos}</li>
                </ul>
              </div>
            )}
            
            {health.checks.database.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">错误代码: {health.checks.database.error.code}</p>
                  <p className="text-sm mt-1">{health.checks.database.error.name}</p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* YouTube API 状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            YouTube API 配置
          </CardTitle>
          <CardDescription>YouTube Data API v3 密钥配置状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm flex items-center gap-2">
              <span className="font-medium">YOUTUBE_API_KEY:</span>
              {health.checks.youtube.hasApiKey ? (
                <Badge variant="secondary">已配置</Badge>
              ) : (
                <Badge variant="destructive">未配置</Badge>
              )}
            </p>
            <p className="text-sm flex items-center gap-2">
              <span className="font-medium">NEXT_PUBLIC_YOUTUBE_API_KEY:</span>
              {health.checks.youtube.hasPublicApiKey ? (
                <Badge variant="secondary">已配置</Badge>
              ) : (
                <Badge variant="destructive">未配置</Badge>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 部署信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            部署信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">平台:</span> {health.checks.deployment.platform}
            </p>
            <p className="text-sm">
              <span className="font-medium">区域:</span> {health.checks.deployment.region}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 故障排除提示 */}
      {health.status !== 'healthy' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">故障排除步骤：</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>在 Vercel 项目设置中检查环境变量是否正确配置</li>
              <li>确保 DATABASE_URL 是有效的 PostgreSQL 连接字符串</li>
              <li>验证数据库服务器允许从 Vercel 的 IP 地址连接</li>
              <li>检查 YouTube API 密钥是否有效且已启用 YouTube Data API v3</li>
              <li>查看 Vercel 函数日志了解更多错误详情</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}