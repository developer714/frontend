'use client'

import { useSupabaseUser } from '@/utils/useSupabaseUser'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import AuthWarning from '@/components/auth/AuthWarning'

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const user = useSupabaseUser()
  const pathname = usePathname()

  // List of paths that don't require authentication
  const publicPaths = ['/', '/login', '/signup', '/verify-email']
  const isPublicPath = publicPaths.includes(pathname)

  if (!user && !isPublicPath) {
    return <AuthWarning />
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="flex flex-col md:flex-row h-screen">
        {user && <Sidebar />}
        <div className="flex-1 flex flex-col min-h-screen md:min-h-0">
          <Navbar />
          <main className="flex-1 overflow-y-auto">
            <div className="py-4 md:py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
} 