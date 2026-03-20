import { useState } from 'react'
import { BookOpen, Loader2 } from 'lucide-react'
import { signIn, signUp } from '../hooks/useAuth'

export default function AuthPage() {
  const [mode,        setMode]        = useState<'signin' | 'signup'>('signin')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      if (!displayName.trim()) { setError('Please enter your name.'); setLoading(false); return }
      const { error } = await signUp(email, password, displayName)
      if (error) setError(error.message)
      else setSuccess('Account created. Check your email to confirm, then sign in.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <BookOpen size={20} className="text-gray-900" />
          <span className="text-sm font-semibold tracking-widest uppercase text-gray-900">KLASS Studio</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h1 className="text-base font-semibold text-gray-900 mb-1">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="text-xs text-gray-400 mb-5">
            {mode === 'signin'
              ? 'Sign in to your KLASS Studio account.'
              : 'Join KLASS Studio as a course builder.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Your name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="e.g. Amaka Osei"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Email</label>
              <input
                type="email"
                required
                autoFocus={mode === 'signin'}
                className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
            )}
            {success && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-sm py-2.5 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors mt-1"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setSuccess(null) }}
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">KLASS Studio — Course Content Builder</p>
      </div>
    </div>
  )
}
