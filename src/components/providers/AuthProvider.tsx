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

  const loadProfile = useCallback(async (userId: string, email?: string, fullName?: string) => {
    try {
      const supabase = createClient()
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email || '',
            full_name: fullName || (email ? email.split('@')[0] : 'Utente'),
          })
          .select()
          .single()
        if (newProfile) setProfile(newProfile as Profile)
      } else if (existingProfile) {
        setProfile(existingProfile as Profile)
      }
    } catch (err) {
      console.error('[AuthProvider] Profile load error:', err)
    }
  }, [])

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

    // Safety timeout
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('[AuthProvider] Timeout — forcing loading=false')
        setLoading(false)
      }
    }, 5000)

    // Use getUser() — makes a real API call, most reliable way to check auth
    const initAuth = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser()

        if (!mounted) return

        if (error) {
          console.warn('[AuthProvider] getUser error:', error.message)
        }

        if (authUser) {
          setUser(authUser)
          await loadProfile(
            authUser.id,
            authUser.email,
            authUser.user_metadata?.full_name
          )
        }
      } catch (err) {
        console.error('[AuthProvider] Init error:', err)
      } finally {
        if (mounted) {
          setLoading(false)
          clearTimeout(timeout)
        }
      }
    }

    initAuth()

    // Listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await loadProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata?.full_name
          )
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
