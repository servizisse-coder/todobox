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
      console.error('Sign out error:', e)
    }
    setUser(null)
    setProfile(null)
    router.push('/login')
  }, [router])

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initializedRef.current) return
    initializedRef.current = true

    let mounted = true

    // Safety timeout — if auth takes more than 3 seconds, stop loading
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timeout — forcing loading to false')
        setLoading(false)
      }
    }, 3000)

    const initAuth = async () => {
      try {
        const supabase = createClient()

        // First, get the current session directly
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (!mounted) return

        if (sessionError) {
          console.error('Session error:', sessionError)
          setLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)

          // Load profile (non-blocking for loading state)
          try {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (mounted && existingProfile) {
              setProfile(existingProfile as Profile)
            }
          } catch (profileErr) {
            console.error('Profile load error:', profileErr)
          }
        }

        if (mounted) setLoading(false)

        // Set up listener for future auth changes (sign in, sign out, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!mounted) return

            if (event === 'SIGNED_IN' && newSession?.user) {
              setUser(newSession.user)
              try {
                const { data: prof } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', newSession.user.id)
                  .single()
                if (mounted && prof) setProfile(prof as Profile)
              } catch (e) {
                console.error('Profile load on sign in:', e)
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null)
              setProfile(null)
              router.push('/login')
            } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
              setUser(newSession.user)
            }
          }
        )

        // Store cleanup function
        return () => {
          subscription.unsubscribe()
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        if (mounted) setLoading(false)
      }
    }

    let cleanupSubscription: (() => void) | undefined

    initAuth().then((cleanup) => {
      cleanupSubscription = cleanup
    })

    return () => {
      mounted = false
      clearTimeout(timeout)
      cleanupSubscription?.()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
