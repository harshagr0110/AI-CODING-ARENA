"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function RematchButton({ roomId, isHost, roomStatus }: { roomId: string, isHost: boolean, roomStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [canRejoin, setCanRejoin] = useState(roomStatus === 'waiting');

  useEffect(() => {
    setCanRejoin(roomStatus === 'waiting');
  }, [roomStatus]);

  const handleRematch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${roomId}/rematch`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to start rematch");
      router.push(`/rooms/${roomId}`);
    } catch (err) {
      alert("Error starting rematch. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRejoin = () => {
    router.push(`/rooms/${roomId}`);
  };

  if (isHost) {
    return (
      <Button onClick={handleRematch} disabled={loading} variant="default">
        {loading ? "Rematching..." : "Start Rematch"}
      </Button>
    );
  }
  if (canRejoin) {
    return (
      <Button onClick={handleRejoin} variant="default">
        Rejoin Rematch
      </Button>
    );
  }
  return null;
} 