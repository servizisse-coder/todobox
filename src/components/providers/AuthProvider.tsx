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

function clearAuthCookies() {
  document.cookie.split(';').forEach(c => {
    const name = c.trim().split('=')[0]
    if (name.includes('sb-') || name.includes('supabase')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }
  })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const initializedRef = useRef(false)

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (e) {
      console.error('[AuthProvider] Sign out error:', e)
    }
    clearAuthCookies()
    setUser(null)
    setProfile(null)
    window.location.href = '/login'
  }, [])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const supabase = createClient()
    let mounted = true

    const timeout = setTimeout(() => {
      if (mounted && !authReady) {
        setLoading(false)
        setAuthReady(true)
      }
    }, 5000)

    const fetchProfile = async (userId: string): Promise<Profile | null> => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('[AuthProvider] Profile query error:', error.code, error.message)
          return null
        }
        return data as Profile
      } catch (err) {
        console.error('[AuthProvider] Profile fetch exception:', err)
        return null
      }
    }

    const init = async () => {
      try {
        // Use getUser() — this validates the token server-side
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

        if (!mounted) return

        if (userError || !authUser) {
          console.log('[AuthProvider] No authenticated user:', userError?.message)
          // Don't clear cookies — middleware handles that server-side
          // Just redirect if on a protected route
          if (!isPublicRoute) {
            window.location.href = '/login'
          }
          return
        }

        // User is authenticated
        setUser(authUser)

        // Fetch profile
        const prof = await fetchProfile(authUser.id)

        if (!mounted) return

        if (prof) {
          setProfile(prof)
        } else {
          // Fallback profile from user metadata
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
        console.error('[AuthProvider] Init exception:', err)
        if (!isPublicRoute) {
          window.location.href = '/login'
        }
      } finally {
        if (mounted) {
          setLoading(false)
          setAuthReady(true)
          clearTimeout(timeout)
        }
      }
    }

    // IMPORTANT: Register listener AFTER init completes to avoid race conditions
    init().then(() => {
      if (!mounted) return

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return

          if (event === 'SIGNED_OUT') {
            setUser(null)
            setProfile(null)
            window.location.href = '/login'
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            setUser(session.user)
          } else if (event === 'SIGNED_IN' && session?.user) {
            // Only handle if user changed (e.g., login from another tab)
            setUser(prev => {
              if (prev?.id !== session.user.id) {
                fetchProfile(session.user.id).then(prof => {
                  if (mounted && prof) setProfile(prof)
                })
                return session.user
              }
              return prev
            })
          }
        }
      )

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe()
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeout)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Public routes always render immediately
  if (isPublicRoute) {
    return (
      <AuthContext.Provider value={{ user, profile, loading, signOut }}>
        {children}
      </AuthContext.Provider>
    )
  }

  // Protected routes: block render until auth check completes
  if (loading || !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Caricamento...</p>
        </div>
      </div>
    )
  }

  // No user after auth check → redirect in progress
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
