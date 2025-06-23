"use client"

import { useEffect } from "react"
import { useSocket } from "@/hooks/use-socket"
import { useRouter } from "next/navigation"
import type React from "react"

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
      console.log(`🚪 Joining room ${roomId} as user ${userId}`)
      socket.emit("join-room", { roomId, userId })

      // Listen for game events
      const handleGameStarted = (data: any) => {
        console.log("🎮 Game started:", data.gameId)
        // Force a page refresh to ensure all components are updated
        window.location.reload()
      }

      const handleGameEnded = (data: any) => {
        console.log("🏁 Game ended:", data.reason)
        // Navigate to results page instead of reloading
        router.push(`/games/${data.gameId}/results`)
      }

      const handleSubmissionUpdate = (data: any) => {
        console.log("📝 Submission update:", data.newSubmission?.userId)
      }

      const handleRoomDeleted = (data: any) => {
        console.log("🗑️ Room deleted:", data.roomName)
        // Redirect to rooms page with a message
        router.push("/rooms?deleted=true")
      }

      socket.on("game-started", handleGameStarted)
      socket.on("game-ended", handleGameEnded)
      socket.on("submission-update", handleSubmissionUpdate)
      socket.on("room-deleted", handleRoomDeleted)

      return () => {
        socket.off("game-started", handleGameStarted)
        socket.off("game-ended", handleGameEnded)
        socket.off("submission-update", handleSubmissionUpdate)
        socket.off("room-deleted", handleRoomDeleted)
        socket.emit("leave-room", { roomId })
      }
    }
  }, [socket, isConnected, roomId, userId, router])

  return <>{children}</>
}
