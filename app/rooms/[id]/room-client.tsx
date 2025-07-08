"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSocket } from "@/hooks/use-socket"

interface RoomClientProps {
  roomId: string
  userId: string
  initialJoined: boolean
}

export function RoomClient({ roomId, userId, initialJoined }: RoomClientProps) {
  const [hasJoined, setHasJoined] = useState(initialJoined)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { socket, isConnected } = useSocket()

  const handleJoinRoom = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to join room")
      }

      setHasJoined(true)
      // Emit join-room event via socket for real-time update
      if (socket && isConnected) {
        socket.emit("join-room", { roomId, userId })
      }
      // Refresh the page to show updated player list
      router.refresh()
    } catch (error) {
      console.error("Error joining room:", error instanceof Error ? error.message : "Failed to join room")
    } finally {
      setLoading(false)
    }
  }

  if (!hasJoined) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Join this Room</h3>
          <p className="text-gray-500 mb-4">Click the button below to join this coding room.</p>
          <Button onClick={handleJoinRoom} disabled={loading} size="lg">
            {loading ? "Joining..." : "Join Room"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}
