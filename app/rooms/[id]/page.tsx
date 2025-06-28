import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Trophy } from "lucide-react"
import Link from "next/link"
import { RoomClient } from "./room-client"
import { RoomRealtime } from "./room-realtime"
import { StartGameButton } from "./start-game-button"
import { CodeEditor } from "./code-editor"
import { LiveLeaderboard } from "./live-leaderboard"
import { SimpleNotifications } from "./simple-notifications"
import { DeleteRoomButton } from "./delete-room-button"
import { SmallGameTimer } from "./small-game-timer"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function RoomPage({ params }: Props) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
        },
      },
      games: {
        orderBy: { startedAt: "desc" },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        take: 1,
      },
    },
  })

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Room not found</h3>
            <p className="text-gray-500 mb-4">The room you're looking for doesn't exist.</p>
            <Link href="/rooms">
              <Button>Back to Rooms</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const latestGame = room.games[0]
  const participants = latestGame?.participants || []
  const isUserInRoom = participants.some((p) => p.user.id === user.id) || room.creator.id === user.id
  const allPlayers = [room.creator, ...participants.map((p) => p.user)]
  const isHost = room.creator.id === user.id
  const hasRealChallenge = latestGame && latestGame.challengeTitle !== "Waiting for challenge..."

  // Check if user has submitted
  let userSubmission = null
  if (latestGame && hasRealChallenge) {
    userSubmission = await prisma.submission.findFirst({
      where: {
        gameId: latestGame.id,
        userId: user.id,
      },
    })
  }

  // Determine if the game is finished or in progress
  const isGameFinished = latestGame && latestGame.status === "finished"
  const isGameInProgress = latestGame && latestGame.status === "active"

  return (
    <RoomRealtime roomId={id} userId={user.id}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
                <p className="text-gray-600">{room.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span>Code: {room.joinCode}</span>
                  <span>{room.status === "waiting" ? "waiting" : "active"}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <DeleteRoomButton
                  roomId={id}
                  roomName={room.name}
                  isHost={isHost}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Simple notification system */}
          <div className="mb-6">
            <SimpleNotifications
              roomId={id}
              gameId={latestGame?.id}
              currentStatus={room.status}
              playerCount={allPlayers.length}
              maxPlayers={room.maxPlayers}
            />
          </div>

          {/* Add a SmallGameTimer component above the challenge area, only when hasRealChallenge is true and game is not finished */}
          {hasRealChallenge && isGameInProgress && (
            <SmallGameTimer startedAt={typeof latestGame.startedAt === 'string' ? latestGame.startedAt : latestGame.startedAt.toISOString()} durationSeconds={latestGame.durationSeconds} />
          )}

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Game Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Show challenge/results for finished or in-progress games to all users */}
              {hasRealChallenge ? (
                <>
                  {/* Challenge */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span>🎯 {latestGame.challengeTitle}</span>
                        <span>{latestGame.difficulty}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">📝 Problem Description</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">{latestGame.challengeDescription}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">💡 Examples</h4>
                          <div className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                            {JSON.parse(latestGame.challengeExamples).map((example: any, index: number) => (
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
                  {/* Show code editor only if user is a participant and game is active */}
                  {isUserInRoom && isGameInProgress ? (
                    <CodeEditor
                      roomId={id}
                      gameId={latestGame.id}
                      userId={user.id}
                      hasSubmitted={!!userSubmission}
                      existingSubmission={
                        userSubmission
                          ? {
                              code: userSubmission.code,
                              language: userSubmission.language,
                              isCorrect: userSubmission.isCorrect,
                              aiFeedback: userSubmission.aiFeedback || "",
                              score: userSubmission.score,
                              timeComplexity: userSubmission.timeComplexity || "",
                              spaceComplexity: userSubmission.spaceComplexity || "",
                            }
                          : undefined
                      }
                    />
                  ) : isGameInProgress ? (
                    <Card>
                      <CardContent className="text-center py-8 text-blue-700">
                        <p>You are viewing this game as a spectator.</p>
                      </CardContent>
                    </Card>
                  ) : null}
                  {/* Show leaderboard/results for finished or in-progress games */}
                  <LiveLeaderboard gameId={latestGame.id} />
                </>
              ) :
                isUserInRoom ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">🚀 Ready to Start!</h3>
                      <p className="text-gray-500 mb-6">
                        {allPlayers.length < 2
                          ? "Waiting for more players to join..."
                          : "All players are here. Ready to begin the challenge!"}
                      </p>
                      <StartGameButton
                        roomId={id}
                        roomName={room.name}
                        isHost={isHost}
                        playerCount={allPlayers.length}
                        disabled={allPlayers.length < 2}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <RoomClient roomId={id} userId={user.id} initialJoined={false} />
                )
              }
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Live Leaderboard (only show during active game) */}
              {hasRealChallenge && <LiveLeaderboard gameId={latestGame.id} />}

              {/* Players Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>
                      Players ({allPlayers.length}/{room.maxPlayers})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allPlayers.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {player.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{player.username}</span>
                          {player.id === room.creator.id && (
                            <span className="text-xs text-gray-500">Host</span>
                          )}
                          {player.id === user.id && (
                            <span className="text-xs text-gray-500">You</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {Array.from({ length: room.maxPlayers - allPlayers.length }).map((_, index) => (
                      <div key={`empty-${index}`} className="flex items-center p-2 border rounded border-dashed">
                        <div className="flex items-center space-x-2 text-gray-400">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4" />
                          </div>
                          <span className="text-sm">Waiting for player...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5" />
                    <span>Room Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span>{room.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Join Code:</span>
                      <span className="font-mono text-blue-600">{room.joinCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Players:</span>
                      <span>{room.maxPlayers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Privacy:</span>
                      <span>{room.isPrivate ? "Private" : "Public"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Link href="/rooms">
                  <Button variant="outline" className="w-full">
                    Back to Rooms
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RoomRealtime>
  )
}
