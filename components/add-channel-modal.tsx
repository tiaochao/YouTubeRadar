"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ClientYouTubeAPI } from "@/lib/client-youtube-api"

interface AddChannelModalProps {
  isOpen: boolean
  onClose: () => void
  onChannelAdded: () => void
}

export function AddChannelModal({ isOpen, onClose, onChannelAdded }: AddChannelModalProps) {
  const [channelInput, setChannelInput] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const handleAddChannel = async () => {
    if (!channelInput.trim() || isSearching) return
    
    setIsSearching(true)
    setMessage(null)
    
    try {
      const youtubeAPI = new ClientYouTubeAPI()
      let channel = null
      
      if (channelInput.startsWith('@')) {
        channel = await youtubeAPI.getChannelById(channelInput)
      } else if (channelInput.includes('youtube.com')) {
        const match = channelInput.match(/channel\/(UC[\w-]+)/) || 
                     channelInput.match(/@([\w-]+)/)
        if (match) {
          const id = match[0].includes('@') ? `@${match[1]}` : match[1]
          channel = await youtubeAPI.getChannelById(id)
        }
      } else {
        channel = await youtubeAPI.searchChannel(channelInput)
      }

      if (channel) {
        const newChannel = {
          channelId: channel.id,
          title: channel.snippet.title,
          handle: channel.snippet.customUrl || `@${channel.id}`,
          thumbnailUrl: channel.snippet.thumbnails.medium.url,
          viewCount: parseInt(channel.statistics.viewCount) || 0,
          subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
          videoCount: parseInt(channel.statistics.videoCount) || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        const addResponse = await fetch('/api/channels-new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add',
            channelData: newChannel
          })
        })
        
        const addData = await addResponse.json()
        if (addData.ok) {
          setMessage({ type: 'success', text: '频道添加成功' })
          setChannelInput("")
          setTimeout(() => {
            onClose()
            onChannelAdded()
          }, 1000)
        } else {
          throw new Error(addData.error || '添加频道失败')
        }
      } else {
        setMessage({ type: 'error', text: '未找到频道' })
      }
    } catch (error: any) {
      console.error('Failed to add channel:', error)
      const errorMessage = error.message || '添加频道失败'
      
      if (errorMessage.includes('API key not valid')) {
        setMessage({ type: 'error', text: 'API 密钥无效，请检查设置中的 API 密钥' })
      } else if (errorMessage.includes('quotaExceeded')) {
        setMessage({ type: 'error', text: 'API 配额已超限，请明天再试' })
      } else if (errorMessage.includes('forbidden')) {
        setMessage({ type: 'error', text: 'API 访问被拒绝，请检查 API 密钥权限' })
      } else {
        setMessage({ type: 'error', text: `添加失败: ${errorMessage}` })
      }
    } finally {
      setIsSearching(false)
    }
  }

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">添加频道</h2>
        <p className="text-sm text-muted-foreground mb-4">
          输入频道名称、@handle 或 YouTube 链接
        </p>
        
        {message && (
          <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        
        <Input
          placeholder="例如: @mkbhd 或 Marques Brownlee"
          value={channelInput}
          onChange={(e) => setChannelInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !isSearching) {
              e.preventDefault()
              handleAddChannel()
            }
          }}
          disabled={isSearching}
          className="mb-4"
        />
        
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSearching}>
            取消
          </Button>
          <Button onClick={handleAddChannel} disabled={isSearching || !channelInput.trim()}>
            {isSearching ? '搜索中...' : '添加'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}