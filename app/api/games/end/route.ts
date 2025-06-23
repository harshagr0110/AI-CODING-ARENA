import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { gameId } = await request.json()

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 })
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        room: true,
        participants: true,
      },
    })

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Only allow room creator to end game
    if (game.room.createdBy !== user.id) {
      return NextResponse.json({ error: "Only room creator can end the game" }, { status: 403 })
    }

    // End the game
    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: "finished",
        endedAt: new Date(),
      },
    })

    // Update room status
    await prisma.room.update({
      where: { id: game.roomId },
      data: { status: "finished" },
    })

    return NextResponse.json({ message: "Game ended successfully" })
  } catch (error) {
    console.error("Error ending game:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
