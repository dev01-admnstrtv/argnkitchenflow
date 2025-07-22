'use client'

import { useEffect, useState } from 'react'
import { Timer as TimerIcon } from 'lucide-react'

interface TimerProps {
  startTime: string | Date
  className?: string
  showIcon?: boolean
  format?: 'mm:ss' | 'hh:mm:ss' | 'text'
}

export function Timer({ startTime, className = '', showIcon = true, format = 'text' }: TimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const start = new Date(startTime)
    
    const updateElapsedTime = () => {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000)
      setElapsedTime(elapsed)
    }

    // Atualizar imediatamente
    updateElapsedTime()

    // Atualizar a cada segundo
    const interval = setInterval(updateElapsedTime, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    switch (format) {
      case 'mm:ss':
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      case 'hh:mm:ss':
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      case 'text':
      default:
        if (hours > 0) {
          return `${hours}h ${minutes}min`
        } else if (minutes > 0) {
          return `${minutes}min ${secs}s`
        } else {
          return `${secs}s`
        }
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showIcon && <TimerIcon className="h-4 w-4" />}
      <span className="font-mono">{formatTime(elapsedTime)}</span>
    </div>
  )
}

interface CountdownProps {
  targetTime: string | Date
  className?: string
  showIcon?: boolean
  format?: 'mm:ss' | 'hh:mm:ss' | 'text'
  onComplete?: () => void
}

export function Countdown({ targetTime, className = '', showIcon = true, format = 'text', onComplete }: CountdownProps) {
  const [remainingTime, setRemainingTime] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const target = new Date(targetTime)
    
    const updateRemainingTime = () => {
      const now = new Date()
      const remaining = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000))
      setRemainingTime(remaining)
      
      if (remaining === 0 && !isComplete) {
        setIsComplete(true)
        onComplete?.()
      }
    }

    // Atualizar imediatamente
    updateRemainingTime()

    // Atualizar a cada segundo
    const interval = setInterval(updateRemainingTime, 1000)

    return () => clearInterval(interval)
  }, [targetTime, isComplete, onComplete])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    switch (format) {
      case 'mm:ss':
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      case 'hh:mm:ss':
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      case 'text':
      default:
        if (hours > 0) {
          return `${hours}h ${minutes}min`
        } else if (minutes > 0) {
          return `${minutes}min ${secs}s`
        } else {
          return `${secs}s`
        }
    }
  }

  const getColorClass = () => {
    if (isComplete) return 'text-red-600'
    if (remainingTime < 300) return 'text-orange-600' // Menos de 5 minutos
    if (remainingTime < 900) return 'text-yellow-600' // Menos de 15 minutos
    return 'text-green-600'
  }

  return (
    <div className={`flex items-center gap-1 ${className} ${getColorClass()}`}>
      {showIcon && <TimerIcon className="h-4 w-4" />}
      <span className="font-mono">
        {isComplete ? 'Expirado' : formatTime(remainingTime)}
      </span>
    </div>
  )
}

interface StopwatchProps {
  isRunning: boolean
  startTime?: string | Date | null
  className?: string
  showIcon?: boolean
  format?: 'mm:ss' | 'hh:mm:ss' | 'text'
}

export function Stopwatch({ isRunning, startTime, className = '', showIcon = true, format = 'text' }: StopwatchProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!isRunning || !startTime) {
      setElapsedTime(0)
      return
    }

    const start = new Date(startTime)
    
    const updateElapsedTime = () => {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000)
      setElapsedTime(Math.max(0, elapsed))
    }

    // Atualizar imediatamente
    updateElapsedTime()

    // Atualizar a cada segundo
    const interval = setInterval(updateElapsedTime, 1000)

    return () => clearInterval(interval)
  }, [isRunning, startTime])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    switch (format) {
      case 'mm:ss':
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      case 'hh:mm:ss':
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      case 'text':
      default:
        if (hours > 0) {
          return `${hours}h ${minutes}min`
        } else if (minutes > 0) {
          return `${minutes}min ${secs}s`
        } else {
          return `${secs}s`
        }
    }
  }

  const getColorClass = () => {
    if (!isRunning) return 'text-gray-500'
    if (elapsedTime > 1800) return 'text-red-600' // Mais de 30 minutos
    if (elapsedTime > 900) return 'text-orange-600' // Mais de 15 minutos
    return 'text-blue-600'
  }

  return (
    <div className={`flex items-center gap-1 ${className} ${getColorClass()}`}>
      {showIcon && (
        <TimerIcon className={`h-4 w-4 ${isRunning ? 'animate-pulse' : ''}`} />
      )}
      <span className="font-mono">
        {isRunning ? formatTime(elapsedTime) : '00:00'}
      </span>
    </div>
  )
}