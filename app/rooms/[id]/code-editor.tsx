"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useSocket } from "@/hooks/use-socket"
import { Send, Loader2 } from "lucide-react"

interface CodeEditorProps {
  roomId: string
  userId: string
}

export function CodeEditor({ roomId, userId }: CodeEditorProps) {
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const { socket, isConnected } = useSocket()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      alert("Please write some code before submitting.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          code: code.trim(),
          language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit code")
      }

      // Emit socket event for real-time updates
      if (socket && isConnected) {
        socket.emit("code-submitted", {
          roomId,
          userId,
          result: data,
        })
      }

      // Show feedback
      alert(data.isCorrect ? "Correct Solution! 🎉" : "Solution Submitted")

      setSubmitted(true)

      // Refresh page to show updated leaderboard
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error) {
      alert("Submission Error")
      console.error(error instanceof Error ? error.message : "Failed to submit")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">✅ Solution Submitted!</h3>
          <p className="text-gray-600">You can now watch other players compete.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Solution</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Language:</label>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="border rounded px-3 py-1"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>

          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Write your ${language} solution here...`}
            className="min-h-[300px] font-mono text-sm"
          />

          <Button type="submit" disabled={loading || !code.trim()} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Solution
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
