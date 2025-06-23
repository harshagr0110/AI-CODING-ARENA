"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Loader2, Users, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSocket } from "@/hooks/use-socket"

interface StartGameButtonProps {
  roomId: string
  roomName: string
  isHost: boolean
  playerCount: number
  disabled?: boolean
}

export function StartGameButton({ roomId, roomName, isHost, playerCount, disabled }: StartGameButtonProps) {
  const [isStarting, setIsStarting] = useState(false)
  const [difficulty, setDifficulty] = useState('medium')
  const [duration, setDuration] = useState(5 * 60); // default 5 minutes
  const router = useRouter()
  const { toast } = useToast()
  const { socket, isConnected } = useSocket()

  const handleInitiateStart = () => {
    if (!isHost || disabled || isStarting) return

    toast({
      title: "🎮 Preparing Game...",
      description: "Get ready for the countdown!",
      duration: 2000,
    })

    setIsStarting(true)
  }

  const handleCountdownComplete = async () => {
    setIsStarting(true)

    try {
      const response = await fetch("/api/games/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId, difficulty, durationSeconds: duration }),
      })

      if (!response.ok) {
        throw new Error("Failed to start game")
      }

      const data = await response.json()

      // Emit socket event immediately for better synchronization
      if (socket && isConnected) {
        socket.emit("game-started", {
          roomId,
          gameId: data.game.id,
          game: data.game
        })

        // Add all participants to the game tracking
        if (data.participants) {
          data.participants.forEach((participant: any) => {
            socket.emit("add-participant", {
              gameId: data.game.id,
              userId: participant.userId || participant.user.id
            })
          })
        }
      }

      toast({
        title: "🚀 Game Started!",
        description: `The ${difficulty} coding challenge has begun! Timer is now active.`,
        duration: 3000,
      })

      // Refresh the page after a shorter delay for better UX
      setTimeout(() => {
        router.refresh()
      }, 500)
    } catch (error) {
      console.error("❌ Error starting game:", error)
      toast({
        title: "Error",
        description: "Failed to start the game. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsStarting(false)
    }
  }

  // Render button for host or waiting message for non-host
  if (!isHost) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">⏳ Waiting for Host</h3>
          <p className="text-sm text-blue-600 mb-3">The host will start the game when everyone is ready.</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
            <Users className="h-4 w-4" />
            <span>{playerCount} players ready</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.refresh()} className="text-sm">
          <Clock className="h-4 w-4 mr-2" />
          Check for Updates
        </Button>
      </div>
    )
  }

  // Host's "Ready to Start!" view
  return (
    <div className="text-center space-y-4">
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h3 className="font-medium text-green-800 mb-2">🎯 Ready to Start!</h3>
        <p className="text-sm text-green-600 mb-3">All players are here. Choose difficulty and begin the coding challenge!</p>
        <div className="flex items-center justify-center space-x-2 text-sm text-green-700 mb-4">
          <Users className="h-4 w-4" />
          <span>{playerCount} players ready</span>
        </div>
        
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-sm text-green-700">Difficulty:</span>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-sm text-green-700">Duration:</span>
          <Select value={duration.toString()} onValueChange={v => setDuration(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="300">5 min</SelectItem>
              <SelectItem value="600">10 min</SelectItem>
              <SelectItem value="900">15 min</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleCountdownComplete}
        disabled={disabled || isStarting}
        size="lg"
        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
      >
        {isStarting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Starting Game...
          </>
          ) : (
          <>
            <Play className="mr-2 h-5 w-5" />
            Start {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Game ({playerCount} players)
          </>
        )}
      </Button>
      {disabled && <p className="text-sm text-gray-500 mt-2">Need at least 2 players to start</p>}
    </div>
  )
}