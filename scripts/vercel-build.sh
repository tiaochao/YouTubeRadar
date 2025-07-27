#!/bin/bash

echo "Starting Vercel build..."

# 检查是否在 Vercel 环境
if [ "$VERCEL" = "1" ]; then
  echo "Running in Vercel environment"
  
  # 如果没有 DATABASE_URL，创建一个占位符
  if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL not found, using placeholder"
    export DATABASE_URL="postgresql://placeholder:placeholder@localhost/placeholder"
  fi
fi

# 尝试生成 Prisma 客户端
echo "Generating Prisma client..."
npx prisma generate || echo "Prisma generate failed, continuing..."

# 运行构建
echo "Running Next.js build..."
npm run build

echo "Build completed!"