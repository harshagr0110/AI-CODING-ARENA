"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Play, Loader2 } from "lucide-react"
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
  const [duration, setDuration] = useState(300) // default 5 min
  const [mode, setMode] = useState('normal')
  const router = useRouter()
  const { socket, isConnected } = useSocket()

  const handleStartGame = async () => {
    if (!isHost || disabled || isStarting) return

    setIsStarting(true)

    try {
      const response = await fetch("/api/games/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId, difficulty, durationSeconds: duration, mode }),
      })

      if (!response.ok) {
        throw new Error("Failed to start game")
      }

      // Emit socket event for real-time updates
      if (socket && isConnected) {
        socket.emit("game-started", {
          roomId,
        })
      }

      alert("🚀 Game Started!")

      // Refresh the page
      setTimeout(() => {
        router.refresh()
      }, 500)
    } catch (error) {
      console.error("Error starting game:", error)
      alert("Error starting the game. Please try again.")
    } finally {
      setIsStarting(false)
    }
  }

  // Render button for host or waiting message for non-host
  if (!isHost) {
    return (
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">⏳ Waiting for Host</h3>
        <p className="text-sm text-blue-600">{playerCount} players ready</p>
      </div>
    )
  }

  // Host's view
  return (
    <div className="text-center space-y-4">
      <div className="p-4 bg-green-50 rounded-lg">
        <h3 className="font-medium text-green-800 mb-2">🎯 Ready to Start!</h3>
        <p className="text-sm text-green-600 mb-4">{playerCount} players ready</p>
        
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-sm text-green-700">Difficulty:</span>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-sm text-green-700">Duration:</span>
          <select
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            <option value={300}>5 min</option>
            <option value={600}>10 min</option>
            <option value={900}>15 min</option>
          </select>
        </div>
        {isHost && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Game Mode</label>
            <select
              className="border rounded px-2 py-1 w-full"
              value={mode}
              onChange={e => setMode(e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="codegolf">Code Golf (Least Characters)</option>
              <option value="contwrite">Continuous Writing</option>
            </select>
          </div>
        )}
      </div>

      <Button
        onClick={handleStartGame}
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
            Start {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Game
          </>
        )}
      </Button>
      {disabled && <p className="text-sm text-gray-500">Need at least 2 players to start</p>}
    </div>
  )
}