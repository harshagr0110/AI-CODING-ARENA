"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, RefreshCw, Users, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GameNotificationsProps {
  roomId: string
  gameId?: string
  currentStatus: string
  playerCount: number
  maxPlayers: number
}

export function GameNotifications({ roomId, gameId, currentStatus, playerCount, maxPlayers }: GameNotificationsProps) {
  const [lastCheck, setLastCheck] = useState(Date.now())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  // Auto-refresh every 5 seconds when waiting for game to start
  useEffect(() => {
    if (!autoRefresh || currentStatus !== "waiting") return

    const interval = setInterval(async () => {
      try {
        // Check for game status changes
        const response = await fetch(`/api/rooms/${roomId}/status`)
        if (response.ok) {
          const data = await response.json()

          // If status changed, refresh the page
          if (data.status !== currentStatus) {
            toast({
              title: "🎮 Game Status Changed!",
              description: `Room status: ${data.status}`,
              duration: 3000,
            })
            router.refresh()
          }

          // If player count changed, refresh
          if (data.playerCount !== playerCount) {
            toast({
              title: "👥 Player Update",
              description: `${data.playerCount} players in room`,
              duration: 2000,
            })
            router.refresh()
          }
        }
      } catch (error) {
        console.log("Status check failed:", error)
      }

      setRefreshCount((prev) => prev + 1)
      setLastCheck(Date.now())
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, currentStatus, roomId, playerCount, router, toast])

  // Browser notification API
  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const sendBrowserNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      })
    }
  }

  const manualRefresh = () => {
    toast({
      title: "🔄 Refreshing...",
      description: "Checking for updates",
      duration: 1000,
    })
    router.refresh()
  }

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
    toast({
      title: autoRefresh ? "⏸️ Auto-refresh paused" : "▶️ Auto-refresh enabled",
      description: autoRefresh ? "Manual refresh only" : "Checking every 5 seconds",
      duration: 2000,
    })
  }

  return (
    <Card>
      {/* Removed all refresh/pause/resume controls and status UI. Only background logic remains. */}
    </Card>
  )
}
