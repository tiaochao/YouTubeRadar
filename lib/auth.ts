// 用户认证系统
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { storageAdapter } from './storage-adapter'

export interface User {
  id: string
  username: string
  email?: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface JWTPayload {
  userId: string
  username: string
  iat?: number
  exp?: number
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export class AuthService {
  // 密码加密
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  // 密码验证
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  // 生成JWT token
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  }

  // 验证JWT token
  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      console.error('Token verification failed:', error)
      return null
    }
  }

  // 用户注册
  static async register(username: string, password: string, email?: string): Promise<User | null> {
    try {
      // 检查用户名是否已存在
      const existingUser = await this.getUserByUsername(username)
      if (existingUser) {
        throw new Error('用户名已存在')
      }

      // 检查邮箱是否已存在
      if (email) {
        const existingEmail = await this.getUserByEmail(email)
        if (existingEmail) {
          throw new Error('邮箱已存在')
        }
      }

      // 创建新用户
      const passwordHash = await this.hashPassword(password)
      const newUser: User = {
        id: this.generateUserId(),
        username,
        email,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }

      // 保存到存储适配器
      const savedUser = await this.saveUser(newUser)
      return savedUser
    } catch (error) {
      console.error('User registration failed:', error)
      throw error
    }
  }

  // 用户登录
  static async login(username: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>, token: string } | null> {
    try {
      const user = await this.getUserByUsername(username)
      if (!user || !user.isActive) {
        return null
      }

      const isValidPassword = await this.verifyPassword(password, user.passwordHash)
      if (!isValidPassword) {
        return null
      }

      // 生成token
      const token = this.generateToken({
        userId: user.id,
        username: user.username
      })

      // 返回用户信息（不包含密码哈希）
      const { passwordHash, ...userWithoutPassword } = user
      return { user: userWithoutPassword, token }
    } catch (error) {
      console.error('User login failed:', error)
      return null
    }
  }

  // 根据用户名获取用户
  static async getUserByUsername(username: string): Promise<User | null> {
    try {
      const users = await this.getAllUsers()
      return users.find(user => user.username === username) || null
    } catch (error) {
      console.error('Get user by username failed:', error)
      return null
    }
  }

  // 根据邮箱获取用户
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.getAllUsers()
      return users.find(user => user.email === email) || null
    } catch (error) {
      console.error('Get user by email failed:', error)
      return null
    }
  }

  // 根据ID获取用户
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const users = await this.getAllUsers()
      return users.find(user => user.id === userId) || null
    } catch (error) {
      console.error('Get user by ID failed:', error)
      return null
    }
  }

  // 获取所有用户
  static async getAllUsers(): Promise<User[]> {
    try {
      // 使用存储适配器的系统配置功能存储用户数据
      const usersConfig = await storageAdapter.getSystemConfig('users')
      if (!usersConfig) {
        return []
      }

      const users = JSON.parse(usersConfig.value)
      return users.map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      }))
    } catch (error) {
      console.error('Get all users failed:', error)
      return []
    }
  }

  // 保存用户
  static async saveUser(user: User): Promise<User | null> {
    try {
      const users = await this.getAllUsers()
      const existingIndex = users.findIndex(u => u.id === user.id)
      
      if (existingIndex >= 0) {
        // 更新现有用户
        users[existingIndex] = { ...user, updatedAt: new Date() }
      } else {
        // 添加新用户
        users.push(user)
      }

      // 保存到存储适配器
      await storageAdapter.setSystemConfig('users', JSON.stringify(users), '用户数据')
      return user
    } catch (error) {
      console.error('Save user failed:', error)
      return null
    }
  }

  // 更新用户
  static async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    try {
      const user = await this.getUserById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }

      const updatedUser = {
        ...user,
        ...updates,
        updatedAt: new Date()
      }

      return await this.saveUser(updatedUser)
    } catch (error) {
      console.error('Update user failed:', error)
      throw error
    }
  }

  // 删除用户
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const users = await this.getAllUsers()
      const filteredUsers = users.filter(user => user.id !== userId)
      
      if (users.length === filteredUsers.length) {
        return false // 用户不存在
      }

      await storageAdapter.setSystemConfig('users', JSON.stringify(filteredUsers), '用户数据')
      return true
    } catch (error) {
      console.error('Delete user failed:', error)
      return false
    }
  }

  // 生成用户ID
  private static generateUserId(): string {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 创建默认管理员用户
  static async createDefaultAdmin(): Promise<void> {
    try {
      const existingAdmin = await this.getUserByUsername('admin')
      if (existingAdmin) {
        return // 管理员已存在
      }

      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'
      await this.register('admin', defaultPassword, 'admin@youtuberadar.com')
      console.log('Default admin user created')
    } catch (error) {
      console.error('Failed to create default admin:', error)
    }
  }
}

// 从cookie或header中提取token
export function extractTokenFromRequest(request: Request): string | null {
  try {
    // 首先检查Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }

    // 然后检查cookie
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const parts = cookie.trim().split('=')
        if (parts.length >= 2) {
          const name = parts[0]
          const value = parts.slice(1).join('=') // Handle values with = signs
          acc[name] = decodeURIComponent(value)
        }
        return acc
      }, {} as Record<string, string>)
      
      return cookies.auth_token || null
    }

    return null
  } catch (error) {
    console.error('Error extracting token from request:', error)
    return null
  }
}

// 认证中间件助手函数
export async function authenticateRequest(request: Request): Promise<{ user: Omit<User, 'passwordHash'> } | null> {
  try {
    const token = extractTokenFromRequest(request)
    if (!token) {
      return null
    }

    const payload = AuthService.verifyToken(token)
    if (!payload) {
      return null
    }

    const user = await AuthService.getUserById(payload.userId)
    if (!user || !user.isActive) {
      return null
    }

    const { passwordHash, ...userWithoutPassword } = user
    return { user: userWithoutPassword }
  } catch (error) {
    console.error('Request authentication failed:', error)
    return null
  }
}