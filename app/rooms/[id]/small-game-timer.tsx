"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface SmallGameTimerProps {
  startedAt: string // ISO string
  durationSeconds: number
  roomId?: string
  isHost?: boolean
}

export function SmallGameTimer({ startedAt, durationSeconds, roomId, isHost }: SmallGameTimerProps) {
  const [now, setNow] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    if (now === null) return;
    const start = new Date(startedAt).getTime();
    const end = start + durationSeconds * 1000;
    const timeLeft = Math.max(0, Math.floor((end - now) / 1000));
    if (timeLeft === 0) {
      // Any client ends the game when timer is up
      fetch('/api/games/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      });
    }
  }, [now, startedAt, durationSeconds, roomId]);

  if (now === null) {
    // Rendered on the server and during first client render
    return (
      <div style={{ textAlign: "center", margin: "8px 0", fontSize: 14, color: "#555" }}>
        <span>⏰ Loading timer...</span>
      </div>
    );
  }

  const start = new Date(startedAt).getTime();
  const end = start + durationSeconds * 1000;
  const timeLeft = Math.max(0, Math.floor((end - now) / 1000));

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div style={{ textAlign: "center", margin: "8px 0", fontSize: 14, color: "#555" }}>
      <span>⏰ {timeLeft > 0 ? `Time left: ${formatTime(timeLeft)}` : "Time's up!"}</span>
    </div>
  );
} 