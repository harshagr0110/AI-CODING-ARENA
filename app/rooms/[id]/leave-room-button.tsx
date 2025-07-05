"use client"
import { useRouter } from "next/navigation"

export function LeaveRoomButton({ roomId }: { roomId: string }) {
  const router = useRouter()
  const handleLeave = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/leave`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to leave room")
      router.push("/rooms")
    } catch (err) {
      window.alert("Error leaving room. Please try again.")
    }
  }
  return (
    <button onClick={handleLeave} style={{ marginLeft: 8, background: '#eee', border: '1px solid #ccc', padding: '6px 12px', borderRadius: 4 }}>
      Leave Room
    </button>
  )
} 