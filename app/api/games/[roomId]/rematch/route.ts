import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateCodingChallenge } from "@/lib/gemini"
import io from 'socket.io-client'

const socket = io(process.env.NEXT_PUBLIC_SOCKET_IO_URL || 'http://localhost:3001')

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { roomId } = params
    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }
    // Get room and verify user is the creator
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { participants: true, creator: true },
    })
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }
    if (room.creator.id !== user.id) {
      return NextResponse.json({ error: "Only the host can start a rematch" }, { status: 403 })
    }
    // Generate a new challenge
    const challenge = await generateCodingChallenge(room.difficulty || "medium")
    // Reset the room for a new game
    await prisma.room.update({
      where: { id: roomId },
      data: {
        challengeTitle: challenge.title,
        challengeDescription: challenge.description,
        challengeExamples: JSON.stringify(challenge.examples),
        difficulty: room.difficulty,
        startedAt: new Date(),
        endedAt: null,
        status: "in_progress",
        winnerId: null,
        durationSeconds: room.durationSeconds,
      },
    })
    // Delete old submissions
    await prisma.submission.deleteMany({ where: { roomId } })
    // Notify all players via socket
    socket.emit("game-started", { roomId })
    return NextResponse.redirect(`/rooms/${roomId}`)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 