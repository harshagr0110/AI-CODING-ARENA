"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSocket } from "@/hooks/use-socket"

interface DeleteRoomCardButtonProps {
  roomId: string
  roomName: string
  isCreator: boolean
}

export function DeleteRoomCardButton({ roomId, roomName, isCreator }: DeleteRoomCardButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const socket = useSocket()

  if (!isCreator) {
    return null
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete room")
      }

      // Emit socket event to notify other users
      if (socket?.socket) {
        socket.socket.emit("room-deleted", { roomId, roomName })
      }

      toast({
        title: "Room deleted",
        description: `"${roomName}" has been deleted successfully.`,
      })

      router.refresh()
    } catch (error) {
      console.error("Error deleting room:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete room",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="mt-2">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Room</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{roomName}"? This action cannot be undone and will permanently remove:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-6 -mt-2 mb-4">
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>The room and all its data</li>
            <li>All game history and submissions</li>
            <li>All participant information</li>
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete Room"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 