import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import io from 'socket.io-client'

const socket = io(process.env.NEXT_PUBLIC_SOCKET_IO_URL || 'http://localhost:3001')

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const roomId = params.id
    
    // Remove user from room participants
    await prisma.roomParticipant.deleteMany({
      where: {
        roomId,
        userId: user.id,
      },
    })

    // Emit player-left event to the room
    socket.emit('player-left', { roomId, userId: user.id })
    
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to leave room" }, { status: 500 })
  }
} 