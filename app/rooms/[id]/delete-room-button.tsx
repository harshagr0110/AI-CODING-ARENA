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

interface DeleteRoomButtonProps {
  roomId: string
  roomName: string
  isHost: boolean
}

export function DeleteRoomButton({ roomId, roomName, isHost }: DeleteRoomButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  console.log("DeleteRoomButton render:", { roomId, roomName, isHost })

  if (!isHost) {
    console.log("Not host, not rendering delete button")
    return null
  }

  console.log("Rendering delete button for host")

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      console.log("Attempting to delete room:", roomId)
      
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
      })

      console.log("Delete response status:", response.status)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete room")
      }

      toast({
        title: "Room deleted",
        description: `"${roomName}" has been deleted successfully.`,
      })

      router.push("/rooms")
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
        <Button 
          variant="destructive" 
          size="sm" 
          className="cursor-pointer"
          onClick={(e) => {
            console.log("Delete button clicked")
            e.stopPropagation()
          }}
          title="Delete this room"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Room
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Room</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{roomName}"? This action cannot be undone and will permanently remove:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>The room and all its data</li>
              <li>All game history and submissions</li>
              <li>All participant information</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
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