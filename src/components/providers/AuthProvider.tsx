'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
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

const PUBLIC_ROUTES = ['/login', '/register']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const loadProfile = useCallback(async (userId: string, email: string, fullName?: string) => {
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
            email: email,
            full_name: fullName || email.split('@')[0],
          })
          .select()
          .single()

        if (newProfile) setProfile(newProfile as Profile)
      } else if (existingProfile) {
        setProfile(existingProfile as Profile)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/login')
  }, [router])

  // Single effect for auth — runs only once on mount
  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    // Listen for ALL auth state changes, including INITIAL_SESSION
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          await loadProfile(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.full_name
          )
        } else {
          setUser(null)
          setProfile(null)
        }

        setLoading(false)

        // Redirect to login on sign out (only if not already on public route)
        if (event === 'SIGNED_OUT' && !PUBLIC_ROUTES.includes(window.location.pathname)) {
          router.push('/login')
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile, router])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
