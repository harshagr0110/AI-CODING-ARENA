"use client"

import { useEffect, useState } from "react"

interface SmallGameTimerProps {
  startedAt: string // ISO string
  durationSeconds: number
}

export function SmallGameTimer({ startedAt, durationSeconds }: SmallGameTimerProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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