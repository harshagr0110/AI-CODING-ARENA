"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function RematchButton({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  return (
    <Button onClick={handleRematch} disabled={loading} variant="default">
      {loading ? "Rematching..." : "Rematch with Same Group"}
    </Button>
  );
} 