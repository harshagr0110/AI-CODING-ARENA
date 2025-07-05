import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Clock, Target } from "lucide-react"
import Link from "next/link"
import { MainLayout } from "@/components/main-layout"
import { DeleteRoomCardButton } from "../rooms/delete-room-card-button"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"
import { JoinByCode } from "../rooms/join-by-code"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const stats = {
    totalGames: user.gamesPlayed,
    gamesWon: user.gamesWon,
    totalScore: user.totalScore,
    winRate: user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0,
  }

  const activeRooms = await prisma.room.findMany({
    where: {
      status: "waiting",
      currentPlayers: {
        lt: prisma.room.fields.maxPlayers,
      },
      isPrivate: false,
    },
    include: {
      creator: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  })

  const userCreatedRooms = await prisma.room.findMany({
    where: {
      createdBy: user.id,
    },
    include: {
      games: {
        where: {
          status: "active",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  })

  // Debug logging
  console.log("Dashboard active rooms:", activeRooms)

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.username}!</p>
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl">
              {/* Stats Skeletons */}
              {!user ? (
                <>
                  <Skeleton className="h-24 w-full mb-6" />
                  <Skeleton className="h-24 w-full mb-6" />
                  <Skeleton className="h-24 w-full mb-6" />
                </>
              ) : (
                <>
                  <Card className="bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-center">{stats.totalGames}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Games Won</CardTitle>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-center">{stats.gamesWon}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Score</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-center">{stats.totalScore}</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
            {stats.totalGames === 0 && (
              <div className="mt-6 text-gray-500 flex flex-col items-center">
                <Trophy className="h-8 w-8 mb-2 text-gray-300" />
                <span>You haven't played any games yet. Join a room to get started!</span>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Start your coding journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/rooms/create">
                  <Button className="w-full" size="lg">
                    Create New Room
                  </Button>
                </Link>
                <Link href="/rooms">
                  <Button variant="outline" className="w-full" size="lg">
                    Browse Rooms
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button variant="outline" className="w-full" size="lg">
                    View Leaderboard
                  </Button>
                </Link>
                <div className="pt-4">
                  <JoinByCode />
                </div>
              </CardContent>
            </Card>
            {/* Active Rooms Skeletons */}
            {!activeRooms ? (
              <Skeleton className="h-32 w-full mb-8" />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Active Rooms</CardTitle>
                  <CardDescription>Join an ongoing competition</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeRooms.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No active rooms available</p>
                  ) : (
                    <div className="space-y-3">
                      {activeRooms.map((room) => (
                        <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{room.name}</h4>
                            <p className="text-sm text-gray-500">
                              {room.currentPlayers}/{room.maxPlayers} players
                            </p>
                            <p className="text-xs text-gray-400">by {room.creator.username}</p>
                          </div>
                          <Link href={`/rooms/${room.id}`}>
                            <Button size="sm">Join</Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {/* User Created Rooms Skeletons */}
            {!userCreatedRooms ? (
              <Skeleton className="h-32 w-full mb-8" />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Your Rooms</CardTitle>
                  <CardDescription>Manage your created rooms</CardDescription>
                </CardHeader>
                <CardContent>
                  {userCreatedRooms.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">You haven't created any rooms yet</p>
                  ) : (
                    <div className="space-y-3">
                      {userCreatedRooms.map((room: any) => {
                        return (
                          <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{room.name}</h4>
                              <p className="text-sm text-gray-500">
                                {room.currentPlayers}/{room.maxPlayers} players • {room.status}
                              </p>
                              <p className="text-xs text-gray-400">
                                Created {new Date(room.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Link href={`/rooms/${room.id}`}>
                                <Button size="sm" variant="outline">View</Button>
                              </Link>
                              <DeleteRoomCardButton
                                roomId={room.id}
                                roomName={room.name}
                                isCreator={true}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
