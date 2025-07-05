import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Medal, Award, Clock, Code, TrendingUp } from "lucide-react"
import Link from "next/link"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function GameResultsPage({ params }: Props) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Use Room instead of Game
  const room = await prisma.room.findUnique({
    where: { id },
    select: {
      id: true,
      challengeTitle: true,
      challengeDescription: true,
      challengeExamples: true,
      durationSeconds: true,
      startedAt: true,
      endedAt: true,
      status: true,
      name: true,
      difficulty: true,
      maxPlayers: true,
      creator: { select: { username: true } },
      winner: { select: { username: true } },
      participants: {
        select: {
          user: { select: { username: true, id: true } },
        },
      },
      submissions: {
        select: {
          id: true,
          userId: true,
          isCorrect: true,
          score: true,
          language: true,
          timeComplexity: true,
          submittedAt: true,
          user: { select: { username: true } },
        },
        orderBy: { score: "desc" },
        take: 10,
      },
    },
  })

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Game not found</h3>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Find user submission
  const userSubmission = room.submissions.find((s: typeof room.submissions[0]) => s.userId === user.id)
  const gameDuration = room.endedAt
    ? ((new Date(room.endedAt).getTime() - new Date(room.startedAt!).getTime()) / 1000 / 60).toFixed(2)
    : (room.durationSeconds! / 60).toFixed(2)

  // Compute leaderboard: sort by score desc, then by submittedAt asc
  const leaderboard = [...room.submissions]
    .filter((s) => s.isCorrect)
    .sort((a, b) => b.score - a.score || new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
    .map((entry, index) => ({ ...entry, rank: index + 1 }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Game Results</h1>
              <p className="text-gray-600">{room.challengeTitle}</p>
            </div>
            <Badge variant={room.status === "finished" ? "outline" : "default"}>{room.status}</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Always show the challenge/question for this game */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🎯 {room.challengeTitle}</span>
              <span>{room.status}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">📝 Problem Description</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{room.challengeDescription}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">💡 Examples</h4>
                <div className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                  {JSON.parse(room.challengeExamples || '[]').map((example: any, index: number) => (
                    <div key={index} className="mb-3 last:mb-0">
                      <div className="font-medium text-gray-800">Example {index + 1}:</div>
                      <div className="mt-1">
                        <div>
                          <span className="font-medium">Input:</span> {example.input}
                        </div>
                        <div>
                          <span className="font-medium">Output:</span> {example.output}
                        </div>
                        {example.explanation && (
                          <div className="text-gray-600">
                            <span className="font-medium">Explanation:</span> {example.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Game Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span>Game Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Room:</span>
                  <span className="text-sm font-medium">{room.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Host:</span>
                  <span className="text-sm font-medium">{room.creator.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="text-sm font-medium">{gameDuration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Players:</span>
                  <span className="text-sm font-medium">{room.participants.length + 1}</span>
                </div>
                {room.winner && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Winner:</span>
                    <span className="text-sm font-medium">{room.winner.username}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Final Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span>Final Rankings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No correct submissions</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        entry.userId === user.id ? "bg-blue-50 border border-blue-200" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center justify-center w-6 h-6">
                          {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                          {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                          {index === 2 && <Award className="h-5 w-5 text-amber-600" />}
                          {index > 2 && <span className="text-sm font-bold text-gray-500">#{index + 1}</span>}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{entry.user.username}</span>
                          {entry.userId === user.id && (
                            <span className="text-sm font-medium text-blue-500">You</span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium">{entry.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <Link href="/rooms">
            <Button variant="outline">Browse Rooms</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
