"use client"

import { useEffect } from "react"
import { useSocket } from "@/hooks/use-socket"
import { useRouter } from "next/navigation"

interface RoomRealtimeProps {
  roomId: string
  userId: string
  children: React.ReactNode
}

export function RoomRealtime({ roomId, userId, children }: RoomRealtimeProps) {
  const { socket, isConnected } = useSocket()
  const router = useRouter()

  useEffect(() => {
    if (socket && isConnected) {
      // Join the room
      socket.emit("join-room", { roomId, userId })

      // Listen for game events
      socket.on("game-started", () => {
        window.location.reload()
      })

      socket.on("game-ended", (data: any) => {
        // Redirect to results page for this game/room
        if (data && data.gameId) {
          router.push(`/games/${data.gameId}/results`)
        } else {
          router.push(`/rooms/${roomId}`)
        }
      })

      socket.on("submission-update", () => {
        router.refresh()
      })

      socket.on("player-joined", () => {
        router.refresh()
      })

      socket.on("player-left", () => {
        router.refresh()
      })

      // Cleanup when component unmounts
      return () => {
        socket.emit("leave-room", { roomId })
      }
    }
  }, [socket, isConnected, roomId, userId, router])

  return <>{children}</>
}
