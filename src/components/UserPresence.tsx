import React from 'react'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Badge } from './ui/badge'

interface UserPresenceProps {
  users: any[]
}

export const UserPresence: React.FC<UserPresenceProps> = ({ users }) => {
  if (users.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="floating-toolbar rounded-xl shadow-lg p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              {users.length} online
            </span>
          </div>
          
          <div className="flex items-center -space-x-2">
            {users.slice(0, 5).map((user, index) => (
              <Avatar key={user.userId} className="w-8 h-8 border-2 border-background">
                <AvatarFallback 
                  className="text-xs font-medium"
                  style={{ backgroundColor: user.metadata?.color || '#666' }}
                >
                  {(user.metadata?.displayName || 'A').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            
            {users.length > 5 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                +{users.length - 5}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}