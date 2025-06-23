import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Lock, Clock, Hash } from "lucide-react"
import Link from "next/link"
import { MainLayout } from "@/components/main-layout"
import { JoinByCode } from "./join-by-code"
import { DeleteRoomCardButton } from "./delete-room-card-button"
import { RoomDeletedToast } from "./room-deleted-toast"

export default async function RoomsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  // Find all room IDs where user is a participant in any game
  const participantGameRooms = await prisma.gameParticipant.findMany({
    where: { userId: user.id },
    select: { game: { select: { roomId: true } } },
  })
  const joinedRoomIds = [
    ...new Set([
      ...participantGameRooms.map((gp) => gp.game.roomId),
    ]),
  ]
  // Add rooms the user created
  const createdRooms = await prisma.room.findMany({
    where: { createdBy: user.id },
    select: { id: true },
  })
  for (const r of createdRooms) {
    if (!joinedRoomIds.includes(r.id)) joinedRoomIds.push(r.id)
  }
  // Fetch all joined rooms
  const rooms = await prisma.room.findMany({
    where: { id: { in: joinedRoomIds } },
    select: {
      id: true,
      name: true,
      description: true,
      isPrivate: true,
      joinCode: true,
      maxPlayers: true,
      currentPlayers: true,
      status: true,
      createdAt: true,
      createdBy: true,
      creator: { select: { username: true } },
      _count: { select: { games: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })
  const activeRooms = rooms.filter((room: any) => room.status === "waiting" || room.status === "in_progress")
  const finishedRooms = rooms.filter((room: any) => room.status === "finished")

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Game Rooms</h1>
              <p className="text-gray-600">Join a room by code or create your own</p>
            </div>
            <Link href="/rooms/create">
              <Button>Create Room</Button>
            </Link>
          </div>
          <RoomDeletedToast />
          <div className="grid lg:grid-cols-4 gap-6 mb-8">
            <JoinByCode />
          </div>
          <div className="grid gap-6">
            {rooms.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms joined</h3>
                  <p className="text-gray-500 mb-4">Join or create a coding room to get started!</p>
                  <Link href="/rooms/create">
                    <Button>Create Your First Room</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Active Rooms */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Active Rooms</h2>
                  {activeRooms.length === 0 ? (
                    <p className="text-gray-500">No active rooms</p>
                  ) : (
                    <div className="grid gap-6">
                      {activeRooms.map((room: any) => (
                        <Card key={room.id} className="hover:shadow-lg transition-shadow relative">
                          {room.createdBy === user.id && (
                            <div className="absolute top-3 right-3 z-10">
                              <DeleteRoomCardButton
                                roomId={room.id}
                                roomName={room.name}
                                isCreator={true}
                              />
                            </div>
                          )}
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{room.name}</CardTitle>
                              <div className="flex items-center space-x-2">
                                {room.isPrivate && <Lock className="h-4 w-4 text-gray-500" />}
                                <Badge variant={room.status === "waiting" ? "default" : "secondary"}>
                                  {room.status === "waiting" ? "Waiting" : "In Progress"}
                                </Badge>
                              </div>
                            </div>
                            <CardDescription>{room.description || "No description provided"}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4 text-gray-500" />
                                  <span>
                                    {room.currentPlayers}/{room.maxPlayers} players
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Hash className="h-4 w-4 text-blue-500" />
                                <span className="font-mono text-blue-600">{room.joinCode}</span>
                              </div>
                              <div className="text-xs text-gray-500">Created by {room.creator.username}</div>
                              <div className="text-xs text-gray-400">
                                {room._count.games} game{room._count.games !== 1 ? "s" : ""} played
                              </div>
                              <div className="pt-2">
                                <Link href={`/rooms/${room.id}`}>
                                  <Button
                                    className="w-full bg-black text-white hover:bg-gray-900"
                                    size="lg"
                                  >
                                    Enter Room
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                {/* Finished Rooms */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Finished Rooms</h2>
                  {finishedRooms.length === 0 ? (
                    <p className="text-gray-500">No finished rooms</p>
                  ) : (
                    <div className="grid gap-6">
                      {finishedRooms.map((room: any) => (
                        <Card key={room.id} className="hover:shadow-lg transition-shadow relative">
                          {room.createdBy === user.id && (
                            <div className="absolute top-3 right-3 z-10">
                              <DeleteRoomCardButton
                                roomId={room.id}
                                roomName={room.name}
                                isCreator={true}
                              />
                            </div>
                          )}
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{room.name}</CardTitle>
                              <div className="flex items-center space-x-2">
                                {room.isPrivate && <Lock className="h-4 w-4 text-gray-500" />}
                                <Badge variant="outline">Finished</Badge>
                              </div>
                            </div>
                            <CardDescription>{room.description || "No description provided"}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4 text-gray-500" />
                                  <span>
                                    {room.currentPlayers}/{room.maxPlayers} players
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Hash className="h-4 w-4 text-blue-500" />
                                <span className="font-mono text-blue-600">{room.joinCode}</span>
                              </div>
                              <div className="text-xs text-gray-500">Created by {room.creator.username}</div>
                              <div className="text-xs text-gray-400">
                                {room._count.games} game{room._count.games !== 1 ? "s" : ""} played
                              </div>
                              <div className="pt-2">
                                <Link href={`/rooms/${room.id}`}>
                                  <Button
                                    className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    size="lg"
                                  >
                                    View Room
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
