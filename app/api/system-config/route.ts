import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

// 获取系统配置
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const key = searchParams.get('key')
    
    if (key) {
      // 获取特定配置
      const config = await db.systemConfig.findUnique({
        where: { key }
      })
      
      if (!config) {
        // 返回默认值
        const defaultConfigs: Record<string, any> = {
          'max_videos_per_sync': { value: '50', description: '每次同步的最大视频数量' }
        }
        
        if (defaultConfigs[key]) {
          return NextResponse.json({
            ok: true,
            data: { key, ...defaultConfigs[key] }
          })
        }
        
        return NextResponse.json({
          error: "Configuration not found"
        }, { status: 404 })
      }
      
      return NextResponse.json({
        ok: true,
        data: config
      })
    }
    
    // 获取所有配置
    const configs = await db.systemConfig.findMany()
    
    // 添加默认配置如果不存在
    const defaultConfigs = [
      { key: 'max_videos_per_sync', value: '50', description: '每次同步的最大视频数量' }
    ]
    
    for (const defaultConfig of defaultConfigs) {
      const exists = configs.find(c => c.key === defaultConfig.key)
      if (!exists) {
        configs.push({
          id: '',
          ...defaultConfig,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }
    
    return NextResponse.json({
      ok: true,
      data: configs
    })
    
  } catch (error: any) {
    logger.error("SystemConfig", "Failed to get config:", error)
    return NextResponse.json({
      error: "Failed to get configuration"
    }, { status: 500 })
  }
}

// 更新系统配置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { key, value, description } = body
    
    if (!key || !value) {
      return NextResponse.json({
        error: "Key and value are required"
      }, { status: 400 })
    }
    
    // 更新或创建配置
    const config = await db.systemConfig.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description }
    })
    
    logger.info("SystemConfig", `Updated config: ${key} = ${value}`)
    
    return NextResponse.json({
      ok: true,
      data: config
    })
    
  } catch (error: any) {
    logger.error("SystemConfig", "Failed to update config:", error)
    return NextResponse.json({
      error: "Failed to update configuration"
    }, { status: 500 })
  }
}