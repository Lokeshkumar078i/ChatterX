import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getUserById } from "@/lib/data"
import { ChatWindow } from "@/components/chat-window"

interface ChatPageProps {
  params: {
    friendId: string
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const friend = await getUserById(params.friendId)

  if (!friend) {
    redirect("/")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold">ChatterX</h1>
          <nav className="flex items-center gap-4">
            <a href="/" className="hover:underline">
              Home
            </a>
            <a href="/profile" className="hover:underline">
              Profile
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-6">
        <ChatWindow currentUserId={session.userId} friend={friend} />
      </main>
    </div>
  )
}

