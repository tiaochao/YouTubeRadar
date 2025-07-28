"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function AnalyticsSettingsPage() {
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [refreshToken, setRefreshToken] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  useEffect(() => {
    // 检查是否在客户端环境
    if (typeof window === 'undefined') return
    
    // 从本地存储加载配置
    const savedClientId = localStorage.getItem('youtube_analytics_client_id') || ''
    const savedClientSecret = localStorage.getItem('youtube_analytics_client_secret') || ''
    
    setClientId(savedClientId)
    setClientSecret(savedClientSecret)
    
    // 检查服务器端存储的 refresh token
    checkConnectionStatus()
    
    // 检查 URL 参数中的成功状态
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      setMessage({ type: 'success', text: 'YouTube Analytics 连接成功！' })
      // 清除 URL 参数
      window.history.replaceState({}, document.title, window.location.pathname)
      // 重新检查连接状态
      setTimeout(checkConnectionStatus, 1000)
    }
  }, [])

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/analytics', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const hasToken = data.hasRefreshToken || false
        setIsConnected(hasToken)
        setRefreshToken(hasToken ? 'stored' : '')
      }
    } catch (error) {
      console.error('Failed to check connection status:', error)
      setIsConnected(false)
    }
  }

  const handleSave = () => {
    if (typeof window === 'undefined') return
    
    localStorage.setItem('youtube_analytics_client_id', clientId)
    localStorage.setItem('youtube_analytics_client_secret', clientSecret)
    setMessage({ type: 'success', text: '设置已保存' })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleConnect = async () => {
    if (typeof window === 'undefined') return
    
    if (!clientId) {
      setMessage({ type: 'error', text: '请先输入 Client ID' })
      return
    }

    // 生成 OAuth URL
    const redirectUri = window.location.origin + '/api/auth/youtube/callback'
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
      access_type: 'offline',
      prompt: 'consent'
    })
    
    // 保存当前设置到服务器端 cookies 以供 OAuth 回调使用
    try {
      const response = await fetch('/api/auth/youtube/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          clientSecret
        })
      })
      
      if (!response.ok) {
        setMessage({ type: 'error', text: '保存设置失败，请重试' })
        return
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存设置失败，请重试' })
      return
    }
    
    // 保存到本地存储
    handleSave()
    
    // 重定向到 Google OAuth
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  const handleDisconnect = async () => {
    if (typeof window === 'undefined') return
    
    try {
      // 删除服务器端存储的 refresh token
      const response = await fetch('/api/analytics', {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        setRefreshToken('')
        setIsConnected(false)
        setMessage({ type: 'info', text: '已断开连接' })
      } else {
        setMessage({ type: 'error', text: '断开连接失败' })
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
      setMessage({ type: 'error', text: '断开连接失败' })
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">YouTube Analytics API 设置</h1>
      
      {message && (
        <Alert className="mb-6">
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>API 配置</CardTitle>
          <CardDescription>
            配置 YouTube Analytics API 以获取详细的频道统计数据
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 连接状态 */}
          <div className="flex items-center gap-2">
            <span className="font-medium">连接状态：</span>
            {isConnected ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                已连接
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3" />
                未连接
              </Badge>
            )}
          </div>

          {/* OAuth 配置 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientId">OAuth 2.0 Client ID</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="输入您的 Google OAuth Client ID"
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                从 Google Cloud Console 获取
              </p>
            </div>

            <div>
              <Label htmlFor="clientSecret">OAuth 2.0 Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="输入您的 Client Secret"
                className="mt-1"
              />
            </div>

            {refreshToken && (
              <div>
                <Label>Refresh Token</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value="••••••••••••••••"
                    disabled
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                  >
                    断开连接
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button onClick={handleSave} variant="outline">
              保存设置
            </Button>
            {!isConnected && (
              <Button onClick={handleConnect} disabled={!clientId}>
                连接 YouTube Analytics
              </Button>
            )}
          </div>

          {/* 设置说明 */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              如何获取 API 凭据
            </h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>访问 <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a></li>
              <li>创建新项目或选择现有项目</li>
              <li>启用 YouTube Data API v3 和 YouTube Analytics API</li>
              <li>创建 OAuth 2.0 凭据</li>
              <li>添加授权重定向 URI: <code className="bg-background px-1">{typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/auth/youtube/callback</code></li>
              <li>复制 Client ID 和 Client Secret</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}