import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { executeCode } from "@/lib/piston"
import io from 'socket.io-client'

const socket = io(process.env.NEXT_PUBLIC_SOCKET_IO_URL || 'http://localhost:3001')

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { roomId, code, language = "javascript", feedback, isCorrect } = await request.json()
    if (!roomId || !code) return NextResponse.json({ error: "Room ID and code are required" }, { status: 400 })

    const room = await prisma.room.findUnique({ 
      where: { id: roomId },
      include: {
        question: true
      }
    })
    if (!room || room.status !== "in_progress")
      return NextResponse.json({ error: "Room not found or game not active" }, { status: 400 })

    const existingSubmission = await prisma.submission.findFirst({ where: { roomId, userId: user.id } })
    if (existingSubmission)
      return NextResponse.json({ error: "You have already submitted a solution" }, { status: 400 })

    if (!room.question) {
      return NextResponse.json({ error: "No question associated with this room" }, { status: 400 })
    }

    let evaluation
    if (feedback === 'disqualified') {
      evaluation = {
        isCorrect: false,
        feedback: 'disqualified',
        executionTime: 0,
        memoryUsed: 0,
        testResults: [],
      }
    } else {
      evaluation = await executeCode(code, language, room.question.testCases as any[]).catch(() => ({
        isCorrect: false,
        feedback: "Code execution failed. Please try again.",
        executionTime: 0,
        memoryUsed: 0,
        testResults: [],
      }))
    }

    // Calculate score based on correctness and execution time
    let score = 0
    if (evaluation.isCorrect) {
      score = 100
      // Bonus points for faster execution (up to 20 extra points)
      if (evaluation.executionTime < 1000) { // Less than 1 second
        score += Math.max(0, 20 - Math.floor(evaluation.executionTime / 50))
      }
    }

    const submission = await prisma.submission.create({
      data: {
        id: crypto.randomUUID(),
        roomId,
        userId: user.id,
        code: code.trim(),
        language,
        isCorrect: evaluation.isCorrect,
        feedback: evaluation.feedback,
        executionTime: evaluation.executionTime,
        memoryUsed: evaluation.memoryUsed,
        score: score,
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
      // Continuous Writing: end game if all are disqualified or wrong, or if any is correct
      const allSubs = await prisma.submission.findMany({ where: { roomId } })
      const allDisqualifiedOrWrong = allSubs.length === allUserIds.length && allSubs.every(sub => !sub.isCorrect)
      const anyCorrect = allSubs.some(sub => sub.isCorrect)
      if (allDisqualifiedOrWrong || anyCorrect) {
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
        feedback: submission.feedback,
        executionTime: submission.executionTime,
        memoryUsed: submission.memoryUsed,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
