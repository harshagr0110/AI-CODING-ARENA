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
    const existingParticipant = room.participants.find(p => p.user.id === user.id)
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
        participants: true,
      },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.creator.id !== user.id) {
      return NextResponse.json({ error: "Only the room creator can delete the room" }, { status: 403 })
    }

    // Check if there are participants in the room
    if (room.participants.length > 0) {
      return NextResponse.json({ error: "Cannot delete room with active participants" }, { status: 400 })
    }

    // Delete the room and all associated data
    await prisma.$transaction([
      // Delete submissions
      prisma.submission.deleteMany({
        where: {
          roomId: id,
        },
      }),
      // Delete room participants
      prisma.roomParticipant.deleteMany({
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
