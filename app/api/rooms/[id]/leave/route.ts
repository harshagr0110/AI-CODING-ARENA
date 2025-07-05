import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to leave room" }, { status: 500 })
  }
} 