'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const initializedRef = useRef(false)

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (e) {
      console.error('[AuthProvider] Sign out error:', e)
    }
    setUser(null)
    setProfile(null)
    router.push('/login')
  }, [router])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const supabase = createClient()
    let mounted = true

    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
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
        // 1. Get authenticated user via API call
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

        if (!mounted) return

        if (userError || !authUser) {
          console.log('[AuthProvider] No authenticated user:', userError?.message)
          setLoading(false)
          clearTimeout(timeout)
          router.push('/login')
          return
        }

        // 2. User is authenticated — set immediately
        setUser(authUser)

        // 3. Fetch profile
        const prof = await fetchProfile(authUser.id)

        if (!mounted) return

        if (prof) {
          setProfile(prof)
        } else {
          // Profile not found — create a fallback from user metadata
          const fallbackProfile: Profile = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Utente',
            department: null,
            avatar_url: null,
            is_admin: false,
            is_direction: false,
            is_purchasing: false,
            is_todobox_user: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          setProfile(fallbackProfile)

          // Try to create profile in DB (non-blocking)
          supabase.from('profiles').upsert({
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Utente',
          }).then(() => {
            // Re-fetch the actual profile
            fetchProfile(authUser.id).then((p) => {
              if (mounted && p) setProfile(p)
            })
          })
        }
      } catch (err) {
        console.error('[AuthProvider] Init exception:', err)
      } finally {
        if (mounted) {
          setLoading(false)
          clearTimeout(timeout)
        }
      }
    }

    init()

    // Listen for future auth changes (sign in, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const prof = await fetchProfile(session.user.id)
          if (mounted && prof) setProfile(prof)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
          router.push('/login')
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
