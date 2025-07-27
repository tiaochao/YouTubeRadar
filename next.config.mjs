/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.BUILD_STATIC === 'true' ? 'export' : process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
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
  // 禁用React严格模式以避免DOM操作问题
  reactStrictMode: false,
}

export default nextConfig
