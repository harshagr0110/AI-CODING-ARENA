import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { evaluateCode } from "@/lib/gemini"
import io from 'socket.io-client'

const socket = io(process.env.NEXT_PUBLIC_SOCKET_IO_URL || 'http://localhost:3001')

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { roomId, code, language = "cpp", aiFeedback, isCorrect } = await request.json()
    if (!roomId || !code) return NextResponse.json({ error: "Room ID and code are required" }, { status: 400 })

    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room || room.status !== "in_progress")
      return NextResponse.json({ error: "Room not found or game not active" }, { status: 400 })

    const existingSubmission = await prisma.submission.findFirst({ where: { roomId, userId: user.id } })
    if (existingSubmission)
      return NextResponse.json({ error: "You have already submitted a solution" }, { status: 400 })

    const challenge = {
      title: room.challengeTitle || "Coding Challenge",
      description: room.challengeDescription || "",
      examples: room.challengeExamples ? JSON.parse(room.challengeExamples) : [],
    }

    let evaluation
    if (aiFeedback === 'disqualified') {
      evaluation = {
        isCorrect: false,
        feedback: 'disqualified',
        score: 0,
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A',
      }
    } else {
      evaluation = await evaluateCode(code, challenge).catch(() => ({
        isCorrect: false,
        feedback: "Evaluation failed. Please try again.",
        score: 0,
        timeComplexity: "Unknown",
        spaceComplexity: "Unknown",
      }))
    }

    const submission = await prisma.submission.create({
      data: {
        id: crypto.randomUUID(),
        roomId,
        userId: user.id,
        code: code.trim(),
        language,
        isCorrect: evaluation.isCorrect,
        aiFeedback: evaluation.feedback,
        timeComplexity: evaluation.timeComplexity,
        spaceComplexity: evaluation.spaceComplexity,
        score: evaluation.score,
      },
    })

    // Get the room with mode
    const roomData = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: true,
      },
    })
    let allUserIds: string[] = []
    let mode = 'normal'
    if (roomData) {
      allUserIds = [roomData.createdBy, ...roomData.participants.map((p: any) => p.userId)]
      mode = roomData.mode || 'normal'
    }
    // Count submissions in this room
    const submissionCount = await prisma.submission.count({ where: { roomId } })
    if (mode === 'normal') {
      if (submissionCount === allUserIds.length) {
        await prisma.room.update({
          where: { id: roomId },
          data: { status: "finished", endedAt: new Date() },
        })
        socket.emit('game-ended', { roomId, gameId: roomId })
      } else {
        socket.emit('submission-update', {
          newSubmission: { userId: user.id, result: evaluation, timestamp: new Date() },
        })
      }
    } else if (mode === 'codegolf') {
      // Code Golf: winner is shortest correct code
      if (submissionCount === allUserIds.length) {
        // Find the shortest correct submission
        const correctSubs = await prisma.submission.findMany({
          where: { roomId, isCorrect: true },
        })
        let winnerId = null
        let minLen = Infinity
        for (const sub of correctSubs) {
          if (sub.code.length < minLen) {
            minLen = sub.code.length
            winnerId = sub.userId
          }
        }
        await prisma.room.update({
          where: { id: roomId },
          data: { status: "finished", endedAt: new Date(), winnerId },
        })
        socket.emit('game-ended', { roomId, gameId: roomId })
      } else {
        socket.emit('submission-update', {
          newSubmission: { userId: user.id, result: evaluation, timestamp: new Date() },
        })
      }
    } else if (mode === 'contwrite') {
      // Continuous Writing: logic to be implemented in real-time handler
      if (submissionCount === allUserIds.length) {
        await prisma.room.update({
          where: { id: roomId },
          data: { status: "finished", endedAt: new Date() },
        })
        socket.emit('game-ended', { roomId, gameId: roomId })
      } else {
        socket.emit('submission-update', {
          newSubmission: { userId: user.id, result: evaluation, timestamp: new Date() },
        })
      }
    }

    return NextResponse.json({
      message: "Submission evaluated successfully",
      submission: {
        id: submission.id,
        isCorrect: submission.isCorrect,
        score: submission.score,
        aiFeedback: submission.aiFeedback,
        timeComplexity: submission.timeComplexity,
        spaceComplexity: submission.spaceComplexity,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
