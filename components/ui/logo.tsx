import React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  animated?: boolean
}

export function Logo({ className, size = 'md', showText = true, animated = false }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl', 
    xl: 'text-2xl'
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Radar Icon */}
      <div className={cn(
        "relative flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-lg",
        sizeClasses[size],
        animated && "animate-pulse"
      )}>
        {/* Radar Circles */}
        <svg 
          viewBox="0 0 24 24" 
          className={cn("absolute inset-0", sizeClasses[size])}
          fill="none"
        >
          {/* Outer circle */}
          <circle 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="rgba(255,255,255,0.3)" 
            strokeWidth="0.5"
            className={animated ? "animate-ping" : ""}
          />
          {/* Middle circle */}
          <circle 
            cx="12" 
            cy="12" 
            r="7" 
            stroke="rgba(255,255,255,0.5)" 
            strokeWidth="0.5"
            className={animated ? "animate-ping" : ""}
            style={{ animationDelay: '0.2s' }}
          />
          {/* Inner circle */}
          <circle 
            cx="12" 
            cy="12" 
            r="4" 
            stroke="rgba(255,255,255,0.7)" 
            strokeWidth="0.5"
            className={animated ? "animate-ping" : ""}
            style={{ animationDelay: '0.4s' }}
          />
          {/* Radar sweep line */}
          <line 
            x1="12" 
            y1="12" 
            x2="20" 
            y2="8" 
            stroke="white" 
            strokeWidth="1"
            className={animated ? "animate-spin" : ""}
            style={{ 
              transformOrigin: '12px 12px',
              animationDuration: '3s'
            }}
          />
          {/* Center dot */}
          <circle 
            cx="12" 
            cy="12" 
            r="1.5" 
            fill="white"
          />
          {/* Target dots */}
          <circle cx="16" cy="8" r="1" fill="white" opacity="0.8" />
          <circle cx="8" cy="16" r="1" fill="white" opacity="0.6" />
          <circle cx="18" cy="14" r="0.8" fill="white" opacity="0.4" />
        </svg>
      </div>
      
      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold text-foreground tracking-tight",
            textSizeClasses[size]
          )}>
            YouTube
          </span>
          <span className={cn(
            "font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent -mt-1",
            textSizeClasses[size]
          )}>
            Radar
          </span>
        </div>
      )}
    </div>
  )
}

// Animated Radar Scanning Effect Component
export function RadarScan({ className, size = 40 }: { className?: string, size?: number }) {
  return (
    <div className={cn("relative", className)}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 40 40"
        className="animate-spin"
        style={{ animationDuration: '3s' }}
      >
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(239, 68, 68, 0)" />
            <stop offset="70%" stopColor="rgba(239, 68, 68, 0.3)" />
            <stop offset="100%" stopColor="rgba(239, 68, 68, 0.8)" />
          </linearGradient>
        </defs>
        
        {/* Radar sweep */}
        <path
          d="M 20 20 L 20 2 A 18 18 0 0 1 35.86 12 Z"
          fill="url(#radarGradient)"
        />
        
        {/* Radar circles */}
        <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="0.5" />
        <circle cx="20" cy="20" r="12" fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="0.5" />
        <circle cx="20" cy="20" r="6" fill="none" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="0.5" />
        
        {/* Center dot */}
        <circle cx="20" cy="20" r="1.5" fill="#ef4444" />
      </svg>
      
      {/* Detected targets */}
      <div className="absolute top-2 right-3 w-1 h-1 bg-red-500 rounded-full animate-ping" />
      <div className="absolute bottom-4 left-2 w-1 h-1 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-6 left-6 w-1 h-1 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
    </div>
  )
}