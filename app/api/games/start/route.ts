import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateCodingChallenge } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId, difficulty = "medium", durationSeconds } = await request.json()

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

    // Generate AI challenge with fallback
    let challenge
    try {
      challenge = await generateCodingChallenge(difficulty)
    } catch (aiError) {
      console.error("AI challenge generation failed:", aiError)
      // Fallback challenge
      challenge = {
        title: "Two Sum Problem",
        description:
          "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
        examples: [
          {
            input: "nums = [2,7,11,15], target = 9",
            output: "[0,1]",
            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
          },
          {
            input: "nums = [3,2,4], target = 6",
            output: "[1,2]",
            explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
          },
        ],
      }
    }

    // Update the room with the game data
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        challengeTitle: challenge.title,
        challengeDescription: challenge.description,
        challengeExamples: JSON.stringify(challenge.examples),
        difficulty: difficulty,
        startedAt: new Date(),
        durationSeconds: durationSeconds || 300,
        status: "in_progress",
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
