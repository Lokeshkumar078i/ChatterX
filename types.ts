export interface User {
  id: string
  username: string
  email: string
  mobile: string
  avatar?: string
  createdAt: Date
}

export interface FriendRequest {
  id: string
  senderId: string
  receiverId: string
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
  sender: User
}

export interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  seen: boolean
  createdAt: Date
}

export interface Session {
  userId: string
  expires: Date
}

