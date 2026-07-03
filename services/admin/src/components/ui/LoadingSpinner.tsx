import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  message?: string
  size?: "sm" | "md" | "lg"
  fullScreen?: boolean
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12"
}

export function LoadingSpinner({ 
  message = "Loading...", 
  size = "md",
  fullScreen = true 
}: LoadingSpinnerProps) {
  const content = (
    <div className="text-center">
      <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto text-primary`} />
      {message && <p className="mt-2 text-muted-foreground">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}
