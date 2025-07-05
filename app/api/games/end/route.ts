import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = await request.json()

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Only allow room creator to end game
    if (room.createdBy !== user.id) {
      return NextResponse.json({ error: "Only room creator can end the game" }, { status: 403 })
    }

    // End the game by updating room status
    await prisma.room.update({
      where: { id: roomId },
      data: {
        status: "finished",
        endedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Game ended successfully" })
  } catch (error) {
    console.error("Error ending game:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
