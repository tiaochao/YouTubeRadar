'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <CardTitle>加载出错</CardTitle>
          </div>
          <CardDescription>
            应用程序遇到了一个错误。这可能是临时问题。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {error.message || '发生了未知错误'}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-1">
                错误代码: {error.digest}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => reset()}
              variant="default"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              重试
            </Button>
            <Button
              variant="outline"
              asChild
              className="flex-1"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                返回首页
              </Link>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>如果问题持续存在，请检查：</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>数据库连接是否正常</li>
              <li>环境变量是否正确配置</li>
              <li>查看 Vercel 函数日志了解详情</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}