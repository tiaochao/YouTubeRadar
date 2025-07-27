"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/use-i18n"

export default function SettingsPage() {
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 保存设置
  const handleSave = () => {
    setSaving(true)
    setMessage(null)
    
    // 模拟保存
    setTimeout(() => {
      setSaving(false)
      setMessage({ type: 'success', text: t('settings.saved') })
    }, 1000)
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
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