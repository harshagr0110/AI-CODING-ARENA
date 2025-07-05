
import { useEffect, useState } from "react"
import { io } from "socket.io-client"

export function useSocket() {
  const [socket, setSocket] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_IO_URL || "http://localhost:3003"
    const newSocket = io(socketUrl)
    
    setSocket(newSocket)

    newSocket.on("connect", () => {
      setIsConnected(true)
    })

    newSocket.on("disconnect", () => {
      setIsConnected(false)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [])

  return { socket, isConnected }
}