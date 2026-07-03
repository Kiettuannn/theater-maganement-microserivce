import { Camera } from "lucide-react"
import type { ReactNode } from "react"

interface ProfileHeaderProps {
  avatarUrl?: string
  fullName: string
  isEditing: boolean
  onAvatarClick: () => void
  coverGradient?: string
  children?: ReactNode
}

export function ProfileHeader({
  avatarUrl,
  fullName,
  isEditing,
  onAvatarClick,
  coverGradient = "from-blue-500 to-purple-600",
  children
}: ProfileHeaderProps) {
  const getInitial = () => {
    return fullName?.charAt(0).toUpperCase() || "U"
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Cover Image */}
      <div className={`h-32 bg-gradient-to-r ${coverGradient}`}></div>
      
      {/* Profile Info */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={`${fullName} avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-muted-foreground">
                {getInitial()}
              </span>
            )}
          </div>
          
          {isEditing && (
            <button 
              onClick={onAvatarClick}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors cursor-pointer"
              title="Change avatar"
            >
              <Camera className="h-5 w-5" />
            </button>
          )}
        </div>

        {children}
      </div>
    </div>
  )
}
