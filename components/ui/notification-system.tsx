"use client"

import { useEffect, useState } from "react"
import { X, CheckCircle, AlertCircle, XCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message?: string
  duration?: number
}

interface NotificationSystemProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

export function NotificationSystem({ notifications, onRemove }: NotificationSystemProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onRemove={onRemove} />
      ))}
    </div>
  )
}

function NotificationItem({
  notification,
  onRemove,
}: {
  notification: Notification
  onRemove: (id: string) => void
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100)

    // Auto remove
    if (notification.duration !== 0) {
      const removeTimer = setTimeout(() => {
        handleRemove()
      }, notification.duration || 5000)

      return () => {
        clearTimeout(timer)
        clearTimeout(removeTimer)
      }
    }

    return () => clearTimeout(timer)
  }, [notification.duration])

  const handleRemove = () => {
    setIsVisible(false)
    setTimeout(() => onRemove(notification.id), 300)
  }

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getStyles = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800"
      case "error":
        return "bg-red-50 border-red-200 text-red-800"
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800"
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800"
    }
  }

  return (
    <div
      className={cn(
        "min-w-80 max-w-md p-4 rounded-lg border shadow-lg transition-all duration-300 transform",
        getStyles(),
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      )}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          {notification.message && <p className="text-sm opacity-90 mt-1">{notification.message}</p>}
        </div>
        <button onClick={handleRemove} className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
