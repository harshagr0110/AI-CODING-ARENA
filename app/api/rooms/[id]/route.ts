import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: Props) {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
        where: {
          status: "active",
        },
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
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  return NextResponse.json(room)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if room exists and user is the creator
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.creator.id !== user.id) {
      return NextResponse.json({ error: "Only the room creator can delete the room" }, { status: 403 })
    }

    // Delete the room and all associated data
    await prisma.$transaction([
      // Delete leaderboards
      prisma.leaderboard.deleteMany({
        where: {
          game: {
            roomId: id,
          },
        },
      }),
      // Delete submissions
      prisma.submission.deleteMany({
        where: {
          game: {
            roomId: id,
          },
        },
      }),
      // Delete game participants
      prisma.gameParticipant.deleteMany({
        where: {
          game: {
            roomId: id,
          },
        },
      }),
      // Delete games
      prisma.game.deleteMany({
        where: {
          roomId: id,
        },
      }),
      // Delete the room
      prisma.room.delete({
        where: { id },
      }),
    ])

    return NextResponse.json({ message: "Room deleted successfully" })
  } catch (error) {
    console.error("Error deleting room:", error)
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 })
  }
}
