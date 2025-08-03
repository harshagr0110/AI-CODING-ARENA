"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSocket } from "@/hooks/use-socket"
import { MonacoCodeEditor } from "@/components/monaco-code-editor"
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
  const [disqualified, setDisqualified] = useState(false)
  const [mode, setMode] = useState('normal')
  const [recommendedTimeComplexity, setRecommendedTimeComplexity] = useState<string | null>(null)
  const lastLengthRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    // Fetch mode and recommended time complexity from backend (room info)
    fetch(`/api/rooms/${roomId}`)
      .then(res => res.json())
      .then(data => {
        setMode(data.mode || 'normal')
        if (data.question?.recommendedTimeComplexity) {
          setRecommendedTimeComplexity(data.question.recommendedTimeComplexity)
        }
      })
  }, [roomId])

  useEffect(() => {
    if (mode !== 'contwrite' || !isConnected || submitted) return
    let started = false
    let interval: NodeJS.Timeout | null = null
    const startContinuousCheck = () => {
      started = true
      lastLengthRef.current = code.length
      interval = setInterval(() => {
        if (code.length > lastLengthRef.current) {
          lastLengthRef.current = code.length
          // Notify backend of progress (optional)
        } else {
          setDisqualified(true)
          if (socket) socket.emit('disqualified', { roomId, userId })
          // Submit a disqualified submission to the backend
          fetch('/api/submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId,
              code: code.trim(),
              language,
              aiFeedback: 'disqualified',
              isCorrect: false
            })
          })
          if (interval) clearInterval(interval)
        }
      }, 10000)
    }
    // Start after 30 seconds
    timerRef.current = setTimeout(startContinuousCheck, 30000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (interval) clearInterval(interval)
    }
  }, [mode, isConnected, code.length, submitted, socket, roomId, userId, code, language])

  useEffect(() => {
    if (!socket) return
    socket.on('disqualified', (data: any) => {
      if (data.userId === userId) setDisqualified(true)
    })
    return () => {
      socket.off('disqualified')
    }
  }, [socket, userId])

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

  if (disqualified) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <h3 className="text-lg font-medium text-red-600 mb-2">❌ Disqualified!</h3>
          <p className="text-gray-600">You stopped typing for too long in Continuous Writing mode. You cannot submit or edit code anymore.</p>
        </CardContent>
      </Card>
    )
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
        {recommendedTimeComplexity && (
          <div className="mt-2 text-sm text-blue-700">
            <b>Required Time Complexity:</b> {recommendedTimeComplexity}
          </div>
        )}
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
              <option value="c">C</option>
            </select>
          </div>

          <MonacoCodeEditor
            value={code}
            onChange={setCode}
            language={language}
            height="400px"
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
        {/* Show warning for Continuous Writing mode */}
        {mode === 'contwrite' && !submitted && (
          <div className="mb-2 text-yellow-700 text-sm">⚠️ Keep typing! If your code length doesn't increase every 10 seconds after 1 minute, you'll be disqualified.</div>
        )}
      </CardContent>
    </Card>
  )
}
