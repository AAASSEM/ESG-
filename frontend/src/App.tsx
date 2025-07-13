import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'

// Components
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import OnboardingWizard from './pages/OnboardingWizard'
import AssessmentResults from './pages/AssessmentResults'
import TaskManagement from './pages/TaskManagement'
import ProgressTracker from './pages/ProgressTracker'
import Reports from './pages/Reports'
import UserManagement from './pages/UserManagement'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen relative text-light font-inter">
            {/* Animated gradient background */}
            <div className="gradient-bg"></div>
            
            {/* Main content */}
            <div className="relative z-10">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes with layout */}
                <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                <Route path="/onboarding" element={<Layout><OnboardingWizard /></Layout>} />
                <Route path="/onboarding/wizard" element={<Navigate to="/onboarding" replace />} />
                <Route path="/assessment/results" element={<Layout><AssessmentResults /></Layout>} />
                <Route path="/tasks" element={<Layout><TaskManagement /></Layout>} />
                <Route path="/progress" element={<Layout><ProgressTracker /></Layout>} />
                <Route path="/reports" element={<Layout><Reports /></Layout>} />
                <Route path="/users" element={<Layout><UserManagement /></Layout>} />
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App