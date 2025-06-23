"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, Users, Clock, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SimpleNotificationsProps {
  roomId: string
  gameId?: string
  currentStatus: string
  playerCount: number
  maxPlayers: number
}

export function SimpleNotifications({
  roomId,
  gameId,
  currentStatus,
  playerCount,
  maxPlayers,
}: SimpleNotificationsProps) {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/status`)
        if (response.ok) {
          const data = await response.json()
          if (data.status !== currentStatus || data.playerCount !== playerCount) {
            router.refresh()
          }
        }
      } catch (error) {
        // Silent fail
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [currentStatus, roomId, playerCount, router])

  return null
}
