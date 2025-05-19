"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'

export default function ProtectedPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
      if (!user) {
        router.replace('/auth')
      } else {
        setUser(user)
      }
      setLoading(false)
    })
  }, [router])

  if (loading) return <div>Loading...</div>
  if (!user) return null

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Protected Page</h1>
      <p>Welcome, {user.email}!</p>
      <p>This content is only visible to authenticated users.</p>
    </div>
  )
} 