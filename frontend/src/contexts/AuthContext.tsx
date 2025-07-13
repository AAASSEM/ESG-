import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  company_id?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  loading: boolean
}

interface RegisterData {
  email: string
  password: string
  full_name: string
  company_name: string
  business_sector: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/auth/me`)
          setUser(response.data)
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      }
    }
    
    checkAuth()
  }, [token, API_BASE_URL])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      // Clear any existing cached data before logging in new user
      localStorage.removeItem('esg_locations')
      localStorage.removeItem('esg_tasks')
      localStorage.removeItem('esg_users')
      localStorage.removeItem('esg_scoping_data')
      localStorage.removeItem('esg_assessment_results')
      
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)

      const response = await axios.post(`${API_BASE_URL}/api/auth/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const { access_token, user: userData } = response.data
      
      localStorage.setItem('token', access_token)
      setToken(access_token)
      setUser(userData)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: RegisterData) => {
    setLoading(true)
    try {
      // Clear any existing cached data before registering new user
      localStorage.removeItem('esg_locations')
      localStorage.removeItem('esg_tasks')
      localStorage.removeItem('esg_users')
      localStorage.removeItem('esg_scoping_data')
      localStorage.removeItem('esg_assessment_results')
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData)
      const { access_token, user: newUser } = response.data
      
      localStorage.setItem('token', access_token)
      setToken(access_token)
      setUser(newUser)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    // Clear all ESG-related cached data
    localStorage.removeItem('esg_locations')
    localStorage.removeItem('esg_tasks')
    localStorage.removeItem('esg_users')
    localStorage.removeItem('esg_scoping_data')
    localStorage.removeItem('esg_assessment_results')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}