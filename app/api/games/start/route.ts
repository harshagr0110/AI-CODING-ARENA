import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId, difficulty = "medium", durationSeconds, mode = "normal" } = await request.json()

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    // Get room and verify user is the creator
    const room = await prisma.room.findUnique({
      where: { id: roomId },
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

    if (room.createdBy !== user.id) {
      return NextResponse.json({ error: "Only the room creator can start the game" }, { status: 403 })
    }

    if (room.status !== "waiting") {
      return NextResponse.json({ error: "Room is not available for a new game. It may already be finished or in progress." }, { status: 400 })
    }

    if (room.participants.length < 1) {
      return NextResponse.json({ error: "Need at least 2 players to start" }, { status: 400 })
    }

    // Get a random question from the database based on difficulty and mode
    const questionType = mode === 'debugging' ? 'debugging' : 'normal'
    const questions = await prisma.question.findMany({
      where: {
        difficulty: difficulty,
        questionType: questionType,
      },
    })

    if (questions.length === 0) {
      return NextResponse.json({ 
        error: `No ${difficulty} ${questionType} questions available. Please add some questions first.` 
      }, { status: 400 })
    }

    // Select a random question
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)]

    // Update the room with the game data
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        questionId: randomQuestion.id,
        difficulty: difficulty,
        startedAt: new Date(),
        durationSeconds: durationSeconds || 300,
        status: "in_progress",
        mode: mode,
      },
    })

    return NextResponse.json({
      message: "Game started successfully",
      game: updatedRoom,
      participants: room.participants,
    })
  } catch (error: unknown) {
    console.error("Error starting game:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 },
    )
  }
}
