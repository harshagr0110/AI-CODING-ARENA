import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const room = await prisma.room.findUnique({
      where: { id },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.currentPlayers >= room.maxPlayers) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 })
    }

    if (room.status !== "waiting") {
      return NextResponse.json({ error: "Room is not accepting players" }, { status: 400 })
    }

    // Check if user is already in the room
    const existingParticipant = await prisma.gameParticipant.findFirst({
      where: {
        userId: user.id,
        game: {
          roomId: id,
          status: "active",
        },
      },
    })

    if (existingParticipant) {
      return NextResponse.json({ message: "Already in room" })
    }

    // Create or get active game for this room
    let activeGame = await prisma.game.findFirst({
      where: {
        roomId: id,
        status: "active",
      },
    })

    if (!activeGame) {
      // Create a new game session for this room
      activeGame = await prisma.game.create({
        data: {
          id: crypto.randomUUID(),
          roomId: id,
          challengeTitle: "Waiting for challenge...",
          challengeDescription: "Game will start soon",
          challengeExamples: "[]",
          status: "active",
        },
      })
    }

    // Add user as participant
    await prisma.gameParticipant.create({
      data: {
        id: crypto.randomUUID(),
        gameId: activeGame.id,
        userId: user.id,
      },
    })

    // Update room player count
    await prisma.room.update({
      where: { id },
      data: {
        currentPlayers: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ message: "Joined room successfully" })
  } catch (error) {
    console.error("Error joining room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
