import React from 'react'
import { UserCursor } from '../types/whiteboard'

interface UserCursorsProps {
  cursors: UserCursor[]
  currentUserId: string
}

export const UserCursors: React.FC<UserCursorsProps> = ({ cursors, currentUserId }) => {
  return (
    <>
      {cursors
        .filter(cursor => cursor.userId !== currentUserId)
        .map((cursor) => (
          <div
            key={cursor.userId}
            className="user-cursor"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Cursor Icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-md"
            >
              <path
                d="M2 2L18 8L8 12L2 18V2Z"
                fill={cursor.color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            
            {/* User Name Label */}
            <div
              className="absolute top-5 left-2 px-2 py-1 rounded text-xs font-medium text-white shadow-md whitespace-nowrap"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.name}
            </div>
          </div>
        ))}
    </>
  )
}