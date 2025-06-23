import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        games: {
          where: { status: "active" },
          include: {
            participants: true,
          },
          take: 1,
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    const activeGame = room.games[0]
    const playerCount = activeGame ? activeGame.participants.length + 1 : 1 // +1 for room creator

    return NextResponse.json({
      status: room.status,
      playerCount,
      maxPlayers: room.maxPlayers,
      hasActiveGame: !!activeGame,
      gameStarted: activeGame && activeGame.challengeTitle !== "Waiting for challenge...",
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking room status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
