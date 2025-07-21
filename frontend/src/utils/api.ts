import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email: string, password: string) => {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)
    
    return api.post('/api/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  },
  
  register: (userData: {
    email: string
    password: string
    full_name: string
    company_name: string
    business_sector: string
  }) => {
    return api.post('/api/auth/register', userData)
  },
  
  getCurrentUser: () => {
    return api.get('/api/auth/me')
  },
}

// Tasks API
export const tasksAPI = {
  getTasks: (params?: {
    status?: string
    category?: string
    assigned_user_id?: string
    skip?: number
    limit?: number
  }) => {
    return api.get('/api/tasks', { params })
  },
  
  getTask: (taskId: string) => {
    return api.get(`/api/tasks/${taskId}`)
  },
  
  updateTaskStatus: (taskId: string, status: string) => {
    return api.patch(`/api/tasks/${taskId}`, { status })
  },
  
  generateTasks: (companyId: string) => {
    return api.post(`/api/tasks/generate/${companyId}`)
  },
}

// Evidence API
export const evidenceAPI = {
  uploadEvidence: (taskId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post(`/api/tasks/${taskId}/evidence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  getTaskEvidence: (taskId: string) => {
    return api.get(`/api/tasks/${taskId}/evidence`)
  },
  
  downloadEvidence: (evidenceId: string) => {
    return api.get(`/api/evidence/${evidenceId}`, {
      responseType: 'blob',
    })
  },
  
  deleteEvidence: (evidenceId: string) => {
    return api.delete(`/api/evidence/${evidenceId}`)
  },
}

// Companies API
export const companiesAPI = {
  getCompany: (companyId: string) => {
    return api.get(`/api/companies/${companyId}`)
  },
  
  updateCompany: (companyId: string, data: any) => {
    return api.patch(`/api/companies/${companyId}`, data)
  },
  
  getLocations: (companyId: string) => {
    return api.get(`/api/companies/${companyId}/locations`)
  },
  
  createLocation: (companyId: string, locationData: any) => {
    return api.post(`/api/companies/${companyId}/locations`, locationData)
  },
}

// ESG Scoping API
export const esgAPI = {
  getSectors: () => {
    return api.get('/api/esg/sectors')
  },
  
  getSectorQuestions: (sector: string) => {
    return api.get(`/api/esg/sectors/${sector}/questions`)
  },
  
  completeScoping: (companyId: string, scopingData: {
    sector: string
    answers: Record<string, any>
    preferences: Record<string, any>
    location_data?: any[]
  }) => {
    return api.post(`/api/esg/scoping/${companyId}/complete`, scopingData)
  },
  
  getScopingStatus: (companyId: string) => {
    return api.get(`/api/esg/scoping/${companyId}/status`)
  },

  // Smart task regeneration endpoints
  previewTaskChanges: (companyId: string, scopingData: {
    sector: string
    answers: Record<string, any>
    preferences: Record<string, any>
    location_data?: any[]
  }) => {
    return api.post(`/api/esg/scoping/${companyId}/preview`, scopingData)
  },

  updateTasksWithChanges: (companyId: string, scopingData: {
    sector: string
    answers: Record<string, any>
    preferences: Record<string, any>
    location_data?: any[]
  }) => {
    return api.post(`/api/esg/scoping/${companyId}/update`, scopingData)
  },
}

// Reports API
export const reportsAPI = {
  getReportPreview: (companyId: string) => {
    return api.get(`/api/reports/companies/${companyId}/report/preview`)
  },
  
  generateESGReport: (companyId: string, includeEvidence: boolean = true) => {
    return api.get(`/api/reports/companies/${companyId}/report/esg-pdf?include_evidence=${includeEvidence}`, {
      responseType: 'blob'
    })
  },
  
  getSampleReport: () => {
    return api.get('/api/reports/sample-report-pdf', {
      responseType: 'blob'
    })
  },
  
  getESGMetrics: (companyId: string) => {
    return api.get(`/api/reports/companies/${companyId}/esg-metrics`)
  }
}

export default api