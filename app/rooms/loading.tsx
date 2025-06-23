import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-24 w-full mb-6" />
      <Skeleton className="h-32 w-full mb-8" />
      <Skeleton className="h-32 w-full mb-8" />
    </div>
  )
} 