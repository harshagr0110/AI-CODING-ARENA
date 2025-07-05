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
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.participants.length >= room.maxPlayers) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 })
    }

    if (room.status !== "waiting") {
      return NextResponse.json({ error: "Room is not accepting players" }, { status: 400 })
    }

    // Check if user is already in the room
    const existingParticipant = room.participants.find((p: any) => p.user.id === user.id)
    if (existingParticipant) {
      return NextResponse.json({ message: "Already in room" })
    }

    // Add user as participant
    await prisma.roomParticipant.create({
      data: {
        roomId: id,
        userId: user.id,
      },
    })

    return NextResponse.json({ message: "Joined room successfully" })
  } catch (error) {
    console.error("Error joining room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
