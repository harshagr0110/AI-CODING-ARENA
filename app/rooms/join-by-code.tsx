"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function JoinByCode() {
  const [joinCode, setJoinCode] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/rooms/join-by-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          joinCode: joinCode.trim().toUpperCase(),
          password: password.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 && data.error === "Invalid password") {
          setShowPassword(true)
          window.alert("This is a private room. Please enter the password.")
          return
        }
        throw new Error(data.error || "Failed to join room")
      }

      window.alert("Joining room...")

      router.push(`/rooms/${data.roomId}`)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to join room")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join by Code</CardTitle>
        <CardDescription>Enter a room code to join an existing game</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoinByCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="joinCode">Room Code</Label>
            <Input
              id="joinCode"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
              className="text-center text-lg font-mono tracking-wider"
            />
          </div>

          {showPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter room password"
              />
            </div>
          )}

          <Button type="submit" disabled={!joinCode.trim() || loading} className="w-full">
            {loading ? "Joining..." : "Join Room"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
