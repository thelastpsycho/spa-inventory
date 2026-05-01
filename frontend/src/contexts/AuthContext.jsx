import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (token && savedUser) {
        try {
          const response = await authAPI.me()
          setUser(response.data)
        } catch (error) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    console.log('🔑 AuthContext: Starting login process')
    console.log('📧 Email:', email)
    console.log('🔒 Password length:', password?.length)

    try {
      const response = await authAPI.login({ email, password })
      console.log('📡 API Response received:', response.status)
      console.log('📦 Response data:', response.data)

      const { user, token } = response.data
      console.log('👤 User:', user)
      console.log('🎫 Token:', token?.substring(0, 20) + '...')

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)

      console.log('✅ Login process completed successfully')
      return user
    } catch (error) {
      console.error('💥 AuthContext: Login error:', error)
      console.error('💥 Error config:', error.config)
      console.error('💥 Error response:', error.response)
      throw error
    }
  }

  const register = async (name, email, password, passwordConfirmation) => {
    const response = await authAPI.register({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    })
    const { user, token } = response.data

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)

    return user
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
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
