"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Save, Key, BarChart3, Database, Github, TestTube } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/use-i18n"
import { ClientYouTubeAPI } from "@/lib/client-youtube-api"

export default function SettingsPage() {
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [githubConfig, setGithubConfig] = useState({
    token: '',
    owner: '',
    repo: '',
    branch: 'main',
    filePath: 'data/youtube-radar-data.json'
  })
  const [githubStatus, setGithubStatus] = useState<{
    configured: boolean
    connected: boolean
    repoInfo: any
  }>({
    configured: false,
    connected: false,
    repoInfo: null
  })
  const [testingGithub, setTestingGithub] = useState(false)
  const [testingApiKey, setTestingApiKey] = useState(false)
  const [apiKeyTestResult, setApiKeyTestResult] = useState<{ valid: boolean, error?: string } | null>(null)
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // 加载保存的API密钥
    const savedApiKey = localStorage.getItem('youtube_api_key') || ''
    setApiKey(savedApiKey)
    
    // 加载GitHub配置状态
    loadGithubStatus()
  }, [])

  const loadGithubStatus = async () => {
    try {
      const response = await fetch('/api/github-config')
      const data = await response.json()
      if (data.ok) {
        setGithubStatus(data.data)
      }
    } catch (error) {
      console.error('Failed to load GitHub status:', error)
    }
  }

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
    }
  }, [])

  // 配置GitHub存储
  const handleGithubConfig = async () => {
    setTestingGithub(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/github-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(githubConfig)
      })
      
      const data = await response.json()
      if (data.ok) {
        setMessage({ type: 'success', text: 'GitHub存储配置成功！' })
        await loadGithubStatus()
      } else {
        setMessage({ type: 'error', text: data.error || 'GitHub配置失败' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `配置失败: ${error.message}` })
    } finally {
      setTestingGithub(false)
    }
  }

  // 测试GitHub连接
  const handleTestGithub = async () => {
    setTestingGithub(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/github-config', {
        method: 'PUT'
      })
      
      const data = await response.json()
      if (data.ok) {
        setMessage({ type: 'success', text: 'GitHub连接测试成功！' })
      } else {
        setMessage({ type: 'error', text: data.error || 'GitHub连接测试失败' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `测试失败: ${error.message}` })
    } finally {
      setTestingGithub(false)
    }
  }

  // 保存设置
  // 测试API密钥
  const handleTestApiKey = async () => {
    setTestingApiKey(true)
    setApiKeyTestResult(null)
    setMessage(null)
    
    try {
      const youtubeAPI = new ClientYouTubeAPI(apiKey)
      const testResult = await youtubeAPI.testApiKey()
      
      setApiKeyTestResult(testResult)
      
      if (testResult.valid) {
        setMessage({ type: 'success', text: 'API密钥测试成功！' })
      } else {
        setMessage({ type: 'error', text: `API密钥测试失败: ${testResult.error}` })
      }
    } catch (error: any) {
      setApiKeyTestResult({ valid: false, error: error.message })
      setMessage({ type: 'error', text: `测试失败: ${error.message}` })
    } finally {
      setTestingApiKey(false)
    }
  }

  const handleSave = () => {
    setSaving(true)
    setMessage(null)
    
    // 保存API密钥到本地存储
    if (apiKey) {
      localStorage.setItem('youtube_api_key', apiKey)
    } else {
      localStorage.removeItem('youtube_api_key')
    }
    
    // 模拟保存
    setTimeout(() => {
      setSaving(false)
      setMessage({ type: 'success', text: t('settings.saved') })
      // 自动清除消息
      messageTimeoutRef.current = setTimeout(() => {
        setMessage(null)
      }, 3000)
    }, 500)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center gap-4">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-semibold text-lg md:text-2xl">
            {t('settings.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('settings.generalSettingsDescription')}
          </p>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-destructive' : 'border-green-500'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
          <TabsTrigger value="api">{t('settings.api')}</TabsTrigger>
          <TabsTrigger value="about">{t('settings.about')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.displaySettings')}</CardTitle>
              <CardDescription>
                {t('settings.displaySettingsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dateFormat">{t('settings.dateFormat')}</Label>
                <Select defaultValue="relative">
                  <SelectTrigger id="dateFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relative">相对时间 (5分钟前)</SelectItem>
                    <SelectItem value="short">短日期 (2024/01/15)</SelectItem>
                    <SelectItem value="long">长日期 (2024年1月15日)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberFormat">{t('settings.numberFormat')}</Label>
                <Select defaultValue="short">
                  <SelectTrigger id="numberFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">缩写 (1.2K, 3.4M)</SelectItem>
                    <SelectItem value="full">完整 (1,234)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {t('settings.apiSettings')}
              </CardTitle>
              <CardDescription>
                {t('settings.apiSettingsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">YouTube Data API v3 密钥</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="输入您的 API 密钥"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  在 <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a> 获取 API 密钥
                </p>
              </div>
              
              <Alert>
                <AlertDescription>
                  <p className="font-medium mb-2">如何获取 API 密钥：</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>访问 Google Cloud Console</li>
                    <li>创建新项目或选择现有项目</li>
                    <li>启用 YouTube Data API v3</li>
                    <li>创建凭据 → API 密钥</li>
                    <li>复制密钥并粘贴到上方输入框</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                YouTube Analytics API
              </CardTitle>
              <CardDescription>
                获取详细的频道分析数据，包括观看时长、订阅者变化等
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/settings/analytics">
                  配置 Analytics API
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub 数据存储
              </CardTitle>
              <CardDescription>
                将数据存储到GitHub仓库，实现永久保存和跨设备同步
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {githubStatus.configured && githubStatus.repoInfo && (
                <Alert>
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        当前仓库: <strong>{githubStatus.repoInfo.owner}/{githubStatus.repoInfo.repo}</strong>
                      </span>
                      <span className={`text-sm ${githubStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
                        {githubStatus.connected ? '✓ 已连接' : '✗ 连接失败'}
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="githubToken">GitHub Token</Label>
                  <Input
                    id="githubToken"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={githubConfig.token}
                    onChange={(e) => setGithubConfig(prev => ({ ...prev, token: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="githubOwner">仓库所有者</Label>
                  <Input
                    id="githubOwner"
                    placeholder="用户名或组织名"
                    value={githubConfig.owner}
                    onChange={(e) => setGithubConfig(prev => ({ ...prev, owner: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="githubRepo">仓库名称</Label>
                  <Input
                    id="githubRepo"
                    placeholder="my-youtube-data"
                    value={githubConfig.repo}
                    onChange={(e) => setGithubConfig(prev => ({ ...prev, repo: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="githubBranch">分支名称</Label>
                  <Input
                    id="githubBranch"
                    placeholder="main"
                    value={githubConfig.branch}
                    onChange={(e) => setGithubConfig(prev => ({ ...prev, branch: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubFilePath">文件路径</Label>
                <Input
                  id="githubFilePath"
                  placeholder="data/youtube-radar-data.json"
                  value={githubConfig.filePath}
                  onChange={(e) => setGithubConfig(prev => ({ ...prev, filePath: e.target.value }))}
                />
              </div>

              <Alert>
                <AlertDescription>
                  <p className="font-medium mb-2">如何获取 GitHub Token：</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>访问 GitHub Settings → Developer settings → Personal access tokens</li>
                    <li>点击 "Generate new token (classic)"</li>
                    <li>选择权限：repo (完整仓库访问权限)</li>
                    <li>复制生成的 token 并粘贴到上方</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button 
                  onClick={handleGithubConfig}
                  disabled={testingGithub || !githubConfig.token || !githubConfig.owner || !githubConfig.repo}
                  className="flex-1"
                >
                  {testingGithub ? '配置中...' : '保存配置'}
                </Button>
                {githubStatus.configured && (
                  <Button 
                    onClick={handleTestGithub}
                    disabled={testingGithub}
                    variant="outline"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    测试连接
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.aboutYouTubeRadar')}</CardTitle>
              <CardDescription>
                {t('settings.aboutDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">{t('settings.features')}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>实时监控 YouTube 频道数据</li>
                  <li>追踪视频发布和观看统计</li>
                  <li>分析频道增长趋势</li>
                  <li>数据本地存储，隐私安全</li>
                  <li>支持中英文界面</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">{t('settings.dataStorage')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('settings.dataStorageDescription')}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">{t('settings.versionInfo')}</h3>
                <div className="text-sm text-muted-foreground">
                  <p>{t('settings.version')}: 1.0.0</p>
                  <p>{t('settings.lastUpdated')}: 2024年1月</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="min-w-[120px]"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>
    </main>
  )
}