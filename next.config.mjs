/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['yt3.ggpht.com', 'i.ytimg.com'],
  },
  // 支持静态导出
  trailingSlash: true,
  // 跳过 API 路由类型检查
  experimental: {
    typedRoutes: false,
  },
  // 确保客户端渲染
  swcMinify: true,
}

export default nextConfig
