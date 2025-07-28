import { NextRequest, NextResponse } from "next/server"
import { githubStorageAdapter } from "@/lib/github-storage-adapter"
import { successResponse, errorResponse } from "@/lib/api-response"

// 获取GitHub配置状态
export async function GET() {
  try {
    const isConfigured = githubStorageAdapter.isConfigured()
    const isConnected = isConfigured ? await githubStorageAdapter.isConnected() : false
    const repoInfo = githubStorageAdapter.getRepoInfo()
    
    return successResponse({
      configured: isConfigured,
      connected: isConnected,
      repoInfo: repoInfo
    })
  } catch (error: any) {
    return errorResponse("Failed to get GitHub config", error.message, 500)
  }
}

// 配置GitHub存储
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, owner, repo, branch, filePath } = body
    
    if (!token || !owner || !repo) {
      return errorResponse("Missing required fields", "token, owner, and repo are required", 400)
    }
    
    // 配置GitHub存储
    githubStorageAdapter.configure({
      token,
      owner,
      repo,
      branch: branch || 'main',
      filePath: filePath || 'data/youtube-radar-data.json'
    })
    
    // 测试连接
    const isConnected = await githubStorageAdapter.isConnected()
    if (!isConnected) {
      return errorResponse("GitHub connection failed", "Please check your token and repository settings", 400)
    }
    
    return successResponse({
      message: "GitHub storage configured successfully",
      repoInfo: githubStorageAdapter.getRepoInfo()
    })
  } catch (error: any) {
    return errorResponse("Failed to configure GitHub storage", error.message, 500)
  }
}

// 测试GitHub连接
export async function PUT(req: NextRequest) {
  try {
    const isConfigured = githubStorageAdapter.isConfigured()
    if (!isConfigured) {
      return errorResponse("GitHub not configured", "Please configure GitHub storage first", 400)
    }
    
    const isConnected = await githubStorageAdapter.isConnected()
    if (!isConnected) {
      return errorResponse("GitHub connection failed", "Cannot connect to GitHub", 500)
    }
    
    // 尝试获取存储统计信息来测试完整功能
    const stats = await githubStorageAdapter.getStorageStats()
    
    return successResponse({
      message: "GitHub connection successful",
      stats
    })
  } catch (error: any) {
    return errorResponse("GitHub connection test failed", error.message, 500)
  }
}