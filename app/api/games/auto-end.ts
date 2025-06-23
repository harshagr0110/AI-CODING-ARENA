import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json()
    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 })
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { room: true },
    })
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }
    if (game.status === "finished") {
      return NextResponse.json({ message: "Game already finished" })
    }

    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: "finished",
        endedAt: new Date(),
      },
    })
    await prisma.room.update({
      where: { id: game.roomId },
      data: { status: "finished" },
    })

    return NextResponse.json({ message: "Game and room set to finished" })
  } catch (error) {
    console.error("Error auto-ending game:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 