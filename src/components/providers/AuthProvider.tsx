'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
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
  const initRef = useRef(false)

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/login')
  }

  useEffect(() => {
    const supabase = createClient()

    const loadProfile = async (userId: string, email: string, fullName?: string) => {
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
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await loadProfile(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.full_name
          )
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
          if (!PUBLIC_ROUTES.includes(pathname)) {
            router.push('/login')
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
          await loadProfile(session.user.id, session.user.email || '')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname, router])

  useEffect(() => {
    if (initRef.current) return
    if (PUBLIC_ROUTES.includes(pathname)) {
      setLoading(false)
      return
    }

    initRef.current = true
    const supabase = createClient()

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)

        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (existingProfile) {
          setProfile(existingProfile as Profile)
        }
      }
      setLoading(false)
    }

    init()
  }, [pathname])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
