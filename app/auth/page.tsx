"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation';
import { useSupabaseUser } from '@/utils/useSupabaseUser';

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const user = useSupabaseUser();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/protected');
  }, [user, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email for confirmation!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else setMessage('Signed in!')
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    const { error } = await supabase.auth.signOut()
    setLoading(false)
    if (error) setError(error.message)
    else setMessage('Signed out!')
  }

  const handleForgotPassword = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) setError(error.message)
    else setMessage('Password reset email sent!')
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow bg-white">
      <h1 className="text-2xl font-bold mb-4 text-center">{mode === 'signin' ? 'Sign In' : 'Sign Up'}</h1>
      <form onSubmit={handleAuth} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border px-3 py-2 rounded"
          required
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border px-3 py-2 rounded w-full"
            required
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-xs text-gray-500"
            onClick={() => setShowPassword(v => !v)}
            tabIndex={-1}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded w-full">
            {loading ? (mode === 'signin' ? 'Signing In...' : 'Signing Up...') : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
          </button>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <button type="button" className="text-blue-600 hover:underline" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
          <button type="button" className="text-gray-600 hover:underline" onClick={handleForgotPassword} disabled={loading || !email}>
            Forgot password?
          </button>
        </div>
      </form>
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="mt-4 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded w-full flex items-center justify-center gap-2 shadow hover:bg-gray-50"
        disabled={loading}
      >
        <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block mr-2"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C35.64 2.7 30.18 0 24 0 14.82 0 6.73 5.82 2.69 14.09l7.98 6.19C12.13 13.7 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.64 7.01l7.19 5.6C43.98 37.36 46.1 31.45 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.28c-1.01-2.9-1.01-6.06 0-8.96l-7.98-6.19C.99 17.18 0 20.48 0 24c0 3.52.99 6.82 2.69 9.87l7.98-6.19z"/><path fill="#EA4335" d="M24 48c6.18 0 11.36-2.05 15.15-5.59l-7.19-5.6c-2.01 1.35-4.59 2.15-7.96 2.15-6.38 0-11.87-4.2-13.33-9.78l-7.98 6.19C6.73 42.18 14.82 48 24 48z"/></g></svg>
        Continue with Google
      </button>
      <button onClick={handleSignOut} className="mt-4 bg-red-500 text-white px-4 py-2 rounded w-full">Sign Out</button>
      {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      {message && <p className="text-green-600 mt-4 text-center">{message}</p>}
    </div>
  )
} 