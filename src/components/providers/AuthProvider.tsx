'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const initializedRef = useRef(false)

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    // Hard redirect — guaranteed to work
    window.location.href = '/login'
  }, [])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const supabase = createClient()
    let mounted = true

    const fetchProfile = async (userId: string): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) {
        console.error('[AuthProvider] Profile error:', error.message)
        return null
      }
      return data as Profile
    }

    const init = async () => {
      try {
        // Use getSession() — reads from cookie, no network call, always reliable
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error || !session?.user) {
          console.log('[AuthProvider] No session found')
          if (!isPublicRoute) {
            window.location.href = '/login'
          }
          setLoading(false)
          return
        }

        const authUser = session.user
        setUser(authUser)

        const prof = await fetchProfile(authUser.id)
        if (!mounted) return

        if (prof) {
          setProfile(prof)
        } else {
          setProfile({
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Utente',
            department: null,
            avatar_url: null,
            is_admin: false,
            is_direction: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      } catch (err) {
        console.error('[AuthProvider] Init error:', err)
        if (!isPublicRoute) {
          window.location.href = '/login'
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    // Listen for auth changes (login/logout from other tabs, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
          setUser(null)
          setProfile(null)
          window.location.href = '/login'
        } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          setUser(session.user)
          const prof = await fetchProfile(session.user.id)
          if (mounted && prof) setProfile(prof)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Public routes: always render
  if (isPublicRoute) {
    return (
      <AuthContext.Provider value={{ user, profile, loading, signOut }}>
        {children}
      </AuthContext.Provider>
    )
  }

  // Protected routes: show spinner until auth resolves
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // redirect already triggered
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
