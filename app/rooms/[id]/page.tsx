import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Trophy } from "lucide-react"
import Link from "next/link"
import { RoomClient } from "./room-client"
import { RoomRealtime } from "./room-realtime"
import { StartGameButton } from "./start-game-button"
import { CodeEditor } from "./code-editor"
import { DeleteRoomButton } from "./delete-room-button"
import { SmallGameTimer } from "./small-game-timer"
import { LeaveRoomButton } from "./leave-room-button"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function RoomPage({ params }: Props) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, username: true } },
      participants: {
        include: {
          user: { select: { id: true, username: true } },
        },
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

  const isHost = room.creator.id === user.id
  const isUserInRoom = room.participants.some((p: any) => p.user.id === user.id) || isHost
  const participantCount = room.participants.length
  const allPlayers = [room.creator, ...room.participants.map((p: any) => p.user)]
  const hasRealChallenge = room.challengeTitle && room.challengeTitle !== "Waiting for challenge..."

  // Check if user has submitted
  let userSubmission = null
  if (hasRealChallenge) {
    userSubmission = await prisma.submission.findFirst({
      where: {
        roomId: room.id,
        userId: user.id,
      },
    })
  }

  // Determine if the game is finished or in progress
  const isGameFinished = room.status === "finished"
  const isGameInProgress = room.status === "in_progress"

  // Only allow starting a game if the room is in 'waiting' status
  const canStartGame = room.status === "waiting"

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
                  <span>{room.status}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isHost && participantCount === 0 && (
                  <DeleteRoomButton roomId={id} roomName={room.name} isCreator={isHost} currentPlayers={participantCount} />
                )}
                {isUserInRoom && !isHost && <LeaveRoomButton roomId={id} />}
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Game timer */}
          {hasRealChallenge && isGameInProgress && room.startedAt && (
            <SmallGameTimer
              startedAt={room.startedAt instanceof Date ? room.startedAt.toISOString() : room.startedAt}
              durationSeconds={room.durationSeconds ?? 0}
            />
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
                        <span>🎯 {room.challengeTitle}</span>
                        <span>{room.difficulty}</span>
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
                            {(room.challengeExamples ? JSON.parse(room.challengeExamples) : []).map((example: any, index: number) => (
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
                      roomId={room.id}
                      userId={user.id}
                    />
                  ) : isGameInProgress ? (
                    <Card>
                      <CardContent className="text-center py-8 text-blue-700">
                        <p>You are viewing this game as a spectator.</p>
                      </CardContent>
                    </Card>
                  ) : null}
                </>
              ) :
                canStartGame && isUserInRoom ? (
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
                ) : !canStartGame ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Room Finished</h3>
                      <p className="text-gray-500 mb-6">This room has already been used for a game and cannot be used again.</p>
                      <Link href="/rooms">
                        <Button>Back to Rooms</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <RoomClient roomId={id} userId={user.id} initialJoined={false} />
                )
              }
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Players Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Players ({allPlayers.length}/{room.maxPlayers})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allPlayers.map((player) => (
                      <div key={player.id} className="flex items-center space-x-2 p-2 border rounded">
                        <span className="font-medium">{player.username}</span>
                        {player.id === room.creator.id && (
                          <span className="text-xs text-gray-500">(Host)</span>
                        )}
                        {player.id === user.id && (
                          <span className="text-xs text-blue-500">(You)</span>
                        )}
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
