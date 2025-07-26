"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, ExternalLink, Copy, Settings, Clock, Play, Radar, Target, Cog, Shield, Database } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/use-i18n"
import { RadarScan } from "@/components/ui/logo"
import { LanguageSwitcher } from "@/components/language-switcher"

interface ConfigData {
  databaseUrl: string
  hasRedisConfig: boolean
  hasCronSecret: boolean
  redisUrl: string
  redisToken: string
  cronSecret: string
  youtubeApiKey: string
}

interface ValidationResult {
  valid: boolean
  message: string
  details?: any
  nextSteps?: string[]
  testAuthUrl?: string
}

export default function SettingsPage() {
  const { t } = useI18n()
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 表单数据
  const [formData, setFormData] = useState({
    youtubeApiKey: '',
    redisUrl: '',
    redisToken: '',
    cronSecret: '',
    maxVideosPerSync: '50'
  })

  // 加载当前配置
  useEffect(() => {
    fetchConfig()
    fetchSystemConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/config')
      const data = await response.json()
      if (data.ok) {
        setConfig(data.data)
        setFormData({
          youtubeApiKey: data.data.youtubeApiKey || '',
          redisUrl: data.data.redisUrl === '••••••••' ? '' : data.data.redisUrl,
          redisToken: data.data.redisToken === '••••••••' ? '' : data.data.redisToken,
          cronSecret: data.data.cronSecret === '••••••••' ? '' : data.data.cronSecret,
          maxVideosPerSync: '50'
        })
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemConfig = async () => {
    try {
      const response = await fetch('/api/system-config?key=max_videos_per_sync')
      const data = await response.json()
      if (data.ok && data.data?.value) {
        setFormData(prev => ({ ...prev, maxVideosPerSync: data.data.value }))
      }
    } catch (error) {
      console.error('Failed to fetch system config:', error)
    }
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      if (data.ok) {
        // 保存系统配置
        const maxVideos = parseInt(formData.maxVideosPerSync)
        if (maxVideos >= 10 && maxVideos <= 500) {
          await fetch('/api/system-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: 'max_videos_per_sync',
              value: formData.maxVideosPerSync,
              description: '每次同步的最大视频数量'
            })
          })
        }
        
        setMessage({ type: 'success', text: data.data.message })
        await fetchConfig()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: 'success', text: t('settings.copiedToClipboard') })
  }

  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="flex items-center gap-4">
          <RadarScan size={40} className="animate-pulse" />
          <div>
            <h1 className="font-semibold text-lg md:text-2xl bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent flex items-center gap-2">
              <Cog className="h-6 w-6 text-red-600" />
              {t('settings.title')}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Shield className="h-3 w-3 text-red-500" />
              雷达系统配置控制中心
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">{t('common.loading')}</div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center gap-4">
        <RadarScan size={40} className="animate-pulse" />
        <div>
          <h1 className="font-semibold text-lg md:text-2xl bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent flex items-center gap-2">
            <Cog className="h-6 w-6 text-red-600" />
            {t('settings.title')}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Shield className="h-3 w-3 text-red-500" />
            雷达系统配置控制中心
          </p>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
          <TabsTrigger value="youtube">YouTube API</TabsTrigger>
          <TabsTrigger value="database">{t('settings.database')}</TabsTrigger>
          <TabsTrigger value="sync">{t('settings.autoSync')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.generalSettings')}</CardTitle>
              <CardDescription>
                {t('settings.generalSettingsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('settings.language')}</Label>
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <p className="text-sm text-muted-foreground">
                    {t('settings.languageDescription')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="youtube" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>YouTube API Configuration</CardTitle>
              <CardDescription>
                Configure your YouTube Data API v3 key to access public channel data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtubeApiKey">YouTube API Key</Label>
                <Input
                  id="youtubeApiKey"
                  type="password"
                  value={formData.youtubeApiKey}
                  onChange={(e) => setFormData({ ...formData, youtubeApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                />
                <p className="text-sm text-muted-foreground">
                  Get your API key from the Google Cloud Console
                </p>
              </div>
              
              <Button asChild variant="outline">
                <a 
                  href="https://console.cloud.google.com/apis/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Google Cloud Console
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.databaseConfig')}</CardTitle>
              <CardDescription>
                {t('settings.configurePostgreSQL')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('settings.currentDatabaseStatus')}</Label>
                <div className="flex items-center gap-2">
                  {config?.databaseUrl ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">{t('settings.configured')}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">{t('settings.notConfigured')}</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('settings.databaseUrl')}: {config?.databaseUrl ? '••••••••' : t('settings.databaseNotSet')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.autoSyncSettings')}</CardTitle>
              <CardDescription>
                {t('settings.autoSyncDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>{t('settings.autoSyncStatus')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.autoSyncStatusDescription')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t('settings.syncHourly')}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.syncFrequency')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.syncFrequencyDescription')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxVideosPerSync">每次同步的最大视频数量</Label>
                  <Input
                    id="maxVideosPerSync"
                    type="number"
                    min="10"
                    max="500"
                    value={formData.maxVideosPerSync}
                    onChange={(e) => setFormData({ ...formData, maxVideosPerSync: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    设置每个频道每次同步的最大视频数量 (10-500)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('settings.redisConfig')}</Label>
                    <Badge variant={config?.hasRedisConfig ? "secondary" : "outline"}>
                      {config?.hasRedisConfig ? t('settings.configured') : t('settings.notConfigured')}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.redisConfigDescription')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('settings.cronSecret')}</Label>
                    <Badge variant={config?.hasCronSecret ? "secondary" : "outline"}>
                      {config?.hasCronSecret ? t('settings.configured') : t('settings.notConfigured')}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.cronSecretDescription')}
                    </p>
                  </div>
                </div>


                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">{t('settings.cronJobConfig')}</p>
                      <p className="text-sm">
                        {t('settings.cronJobDescription')}
                      </p>
                      <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`{
  "crons": [{
    "path": "/api/cron/sync-all-channels",
    "schedule": "0 * * * *"
  }]
}`}
                      </pre>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('settings.apiEndpoint')}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`${window.location.origin}/api/cron/sync-all-channels`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <code className="text-xs text-muted-foreground">
                    POST {window.location.origin}/api/cron/sync-all-channels
                  </code>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.authorizationHeader')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveConfig} 
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? t('settings.saving') : t('settings.saveConfig')}
        </Button>
      </div>
    </main>
  )
}