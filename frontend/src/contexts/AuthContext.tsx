import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import { userStorage } from '../services/userStorage'
import { taskStorage } from '../services/taskStorage'
import { locationStorage } from '../services/locationStorage'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  company_id?: string
}

interface Company {
  id: string
  name: string
  main_location: string
  business_sector: string
  description?: string
  website?: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  company: Company | null
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
  description?: string
  business_sector: string
  main_location?: string
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
  const [company, setCompany] = useState<Company | null>(null)
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
          const userResponse = await axios.get(`${API_BASE_URL}/api/auth/me`)
          setUser(userResponse.data)
          localStorage.setItem('user', JSON.stringify(userResponse.data))
          
          // Sync with userStorage
          userStorage.syncWithAuthUser(userResponse.data)
          
          // Fetch company data
          const companyResponse = await axios.get(`${API_BASE_URL}/api/companies/me`)
          setCompany(companyResponse.data)
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
          setCompany(null)
        }
      }
    }
    
    checkAuth()
  }, [token, API_BASE_URL])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      // Get previous user info to check if this is the same user
      const previousUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Clear non-user-specific cached data
      localStorage.removeItem('esg_locations')
      localStorage.removeItem('esg_tasks')
      localStorage.removeItem('esg_users')
      localStorage.removeItem('esg_scoping_data')
      localStorage.removeItem('esg_assessment_results')
      localStorage.removeItem('esg_user_activity')
      localStorage.removeItem('current_user')
      localStorage.removeItem('onboardingCompleted')
      localStorage.removeItem('businessData')
      
      // Clear user storage completely
      userStorage.clearAllData()
      taskStorage.clearAllTasks()
      locationStorage.clearAllLocations()
      
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)

      const response = await axios.post(`${API_BASE_URL}/api/auth/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const { access_token, user: userData } = response.data
      
      // Check if this is a different user and clear their data if so
      console.log('DEBUG Login: previousUser:', previousUser);
      console.log('DEBUG Login: newUser:', userData);
      console.log('DEBUG Login: emails match?', previousUser.email === userData.email);
      
      if (previousUser.email && previousUser.email !== userData.email) {
        console.log('Different user logging in, clearing previous user data');
        console.log('Previous user company_id:', previousUser.company_id);
        // Clear previous user's onboarding data
        if (previousUser.company_id) {
          console.log('Clearing business data for company:', previousUser.company_id);
          localStorage.removeItem(`onboarding_business_data_${previousUser.company_id}`)
          localStorage.removeItem(`onboarding_locations_${previousUser.company_id}`)
          localStorage.removeItem(`esg_scoping_answers_${previousUser.company_id}`)
          localStorage.removeItem(`esg_tasks_${previousUser.company_id}`)
          localStorage.removeItem(`assessmentResults_${previousUser.company_id}`)
        }
      } else {
        console.log('Same user logging back in, preserving user data');
      }
      
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      setToken(access_token)
      setUser(userData)
      
      // Set authorization header immediately to prevent race condition
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      // Sync with userStorage
      userStorage.syncWithAuthUser(userData)
      
      // Fetch company data after login
      const companyResponse = await axios.get(`${API_BASE_URL}/api/companies/me`)
      setCompany(companyResponse.data)
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
      // Clear ALL existing cached data before registering new user
      localStorage.removeItem('esg_locations')
      localStorage.removeItem('esg_tasks')
      localStorage.removeItem('esg_users')
      localStorage.removeItem('esg_scoping_data')
      localStorage.removeItem('esg_assessment_results')
      localStorage.removeItem('esg_user_activity')
      localStorage.removeItem('current_user')
      localStorage.removeItem('onboardingCompleted')
      localStorage.removeItem('businessData')
      
      // Clear any existing user-specific onboarding data
      // We don't know the previous user's company ID, so we need to clear pattern-matched keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('onboarding_business_data_') || 
            key.startsWith('onboarding_locations_') || 
            key.startsWith('esg_scoping_answers_') ||
            key.startsWith('esg_tasks_') ||
            key.startsWith('assessmentResults_')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear user storage completely
      userStorage.clearAllData()
      taskStorage.clearAllTasks()
      locationStorage.clearAllLocations()
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData)
      const { access_token, user: newUser } = response.data
      
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(newUser))
      setToken(access_token)
      setUser(newUser)
      
      // Set authorization header immediately to prevent race condition
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      // Sync with userStorage
      userStorage.syncWithAuthUser(newUser)
      
      // Fetch company data after registration
      const companyResponse = await axios.get(`${API_BASE_URL}/api/companies/me`)
      setCompany(companyResponse.data)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    // Get current user info before clearing
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Don't clear user-specific onboarding data on logout
    // This allows the same user to log back in and see their data
    // User-specific data will only be cleared when a different user logs in
    
    // Clear ALL ESG-related cached data
    localStorage.removeItem('esg_locations')
    localStorage.removeItem('esg_tasks')
    localStorage.removeItem('esg_users')
    localStorage.removeItem('esg_scoping_data')
    localStorage.removeItem('esg_assessment_results')
    localStorage.removeItem('esg_user_activity')
    localStorage.removeItem('current_user')
    localStorage.removeItem('onboardingCompleted')
    localStorage.removeItem('businessData')
    
    // Clear user storage completely
    userStorage.clearAllData()
    
    setToken(null)
    setUser(null)
    setCompany(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    company,
    token,
    login,
    register,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}