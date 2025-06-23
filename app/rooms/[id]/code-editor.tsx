"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useSocket } from "@/hooks/use-socket"
import { Send, CheckCircle, XCircle, Clock, Trophy, Loader2, Eye, Users } from "lucide-react"

interface CodeEditorProps {
  roomId: string
  gameId: string
  userId: string
  hasSubmitted: boolean
  existingSubmission?: {
    code: string
    language: string
    isCorrect: boolean
    aiFeedback: string
    score: number
    timeComplexity: string
    spaceComplexity: string
  }
}

export function CodeEditor({ roomId, gameId, userId, hasSubmitted, existingSubmission }: CodeEditorProps) {
  const [code, setCode] = useState(existingSubmission?.code || "")
  const [language, setLanguage] = useState(existingSubmission?.language || "cpp")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showSpectatorMode, setShowSpectatorMode] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { socket, isConnected } = useSocket()

  // Auto-enable spectator mode after submission
  useEffect(() => {
    if (hasSubmitted || result) {
      setShowSpectatorMode(true)
    }
  }, [hasSubmitted, result])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please write some code before submitting.",
        variant: "destructive",
      })
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
          gameId,
          code: code.trim(),
          language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit code")
      }

      setResult(data)

      // Show immediate feedback
      toast({
        title: data.isCorrect ? "Correct Solution! 🎉" : "Solution Submitted",
        description: data.isCorrect
          ? `Excellent! You ranked #${data.rank}!`
          : "Your solution has been evaluated. Check the feedback below.",
        variant: data.isCorrect ? "default" : "destructive",
        duration: 5000,
      })

      // Emit socket event for real-time updates (only if socket is available)
      if (socket && isConnected) {
        socket.emit("code-submitted", {
          roomId,
          gameId,
          userId,
          result: {
            ...data,
            username: "You", // This should be the actual username
          },
        })
      }

      // Enable spectator mode
      setShowSpectatorMode(true)

      // Refresh after a short delay to show updated leaderboard
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error) {
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "Failed to submit code",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const submissionResult = result || existingSubmission

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Solution</span>
            <div className="flex items-center space-x-2">
              {hasSubmitted && (
                <Badge variant={submissionResult?.isCorrect ? "default" : "destructive"}>
                  {submissionResult?.isCorrect ? "✅ Correct" : "❌ Incorrect"}
                </Badge>
              )}
              {showSpectatorMode && (
                <></>
              )}
              {!isConnected && (
                <Badge variant="secondary" className="text-xs">
                  Offline Mode
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasSubmitted && !result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center space-x-4">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                  </SelectContent>
                </Select>
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
                    Submitting & Evaluating with AI...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Solution
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Your Submitted Solution
                </h4>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {submissionResult?.language || language}
                  </Badge>
                </div>
                <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                  <code>{submissionResult?.code || code}</code>
                </pre>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">✅ Solution submitted! You can now watch other players compete.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {submissionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {submissionResult.isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>AI Evaluation Results</span>
              <Badge variant={submissionResult.isCorrect ? "default" : "secondary"}>
                {submissionResult.isCorrect ? "Passed" : "Failed"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Time: {submissionResult.timeComplexity}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">AI Feedback</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p className="whitespace-pre-wrap">{submissionResult.aiFeedback}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Time Complexity:</span>
                  <Badge variant="outline" className="ml-2">
                    {submissionResult.timeComplexity}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Space Complexity:</span>
                  <Badge variant="outline" className="ml-2">
                    {submissionResult.spaceComplexity}
                  </Badge>
                </div>
              </div>

              {submissionResult.isCorrect && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <p className="text-green-800 text-sm font-medium">
                    🎉 Congratulations! Your solution is correct and has been added to the leaderboard.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
