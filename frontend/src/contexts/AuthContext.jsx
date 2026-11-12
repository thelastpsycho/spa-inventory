import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

const authError = (message) => {
  const err = new Error(message)
  err.response = { data: { message } }
  return err
}

const loadProfile = async (authUser) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (error) throw authError(error.message)
  return { ...profile, email: authUser.email }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (data?.session?.user) {
        try {
          setUser(await loadProfile(data.session.user))
        } catch {
          setUser(null)
        }
      }
      setLoading(false)
    }

    checkAuth()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setUser(null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw authError(error.message)

    const profile = await loadProfile(data.user)
    if (!profile.is_active) {
      await supabase.auth.signOut()
      throw authError('Account is inactive')
    }

    setUser(profile)
    return profile
  }

  const register = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw authError(error.message)

    if (!data.session) {
      throw authError('Check your email to confirm your account before signing in.')
    }

    const profile = await loadProfile(data.user)
    setUser(profile)
    return profile
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
