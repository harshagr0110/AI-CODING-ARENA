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
        router.push(`/rooms/${data.roomId}`)
      })

      socket.on("submission-update", () => {
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
