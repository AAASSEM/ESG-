import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    }
  }

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundColor: '#111827',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    formContainer: {
      width: '100%',
      maxWidth: '28rem'
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem'
    },
    logoSection: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      marginBottom: '1.5rem'
    },
    logoIcon: {
      width: '3rem',
      height: '3rem',
      borderRadius: '0.75rem',
      backgroundColor: '#10b981',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem'
    },
    logoText: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: 'white'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: 'white',
      marginBottom: '0.5rem'
    },
    subtitle: {
      color: '#9ca3af'
    },
    form: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      color: 'white',
      fontWeight: '500',
      marginBottom: '0.5rem'
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '1rem',
      outline: 'none',
      transition: 'border-color 0.2s ease',
      boxSizing: 'border-box'
    },
    inputFocus: {
      borderColor: '#10b981'
    },
    errorAlert: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    errorIcon: {
      color: '#f87171'
    },
    errorText: {
      color: '#f87171',
      fontSize: '0.875rem'
    },
    rememberSection: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.5rem'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    checkbox: {
      width: '1rem',
      height: '1rem',
      borderRadius: '0.25rem',
      border: '1px solid #4b5563',
      backgroundColor: '#374151'
    },
    forgotLink: {
      fontSize: '0.875rem',
      color: '#10b981',
      textDecoration: 'none',
      cursor: 'pointer'
    },
    submitButton: {
      width: '100%',
      padding: '0.75rem 1.5rem',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    submitButtonHover: {
      backgroundColor: '#059669'
    },
    submitButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    spinner: {
      width: '1rem',
      height: '1rem',
      border: '2px solid #ffffff33',
      borderTop: '2px solid #ffffff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    divider: {
      marginTop: '2rem',
      paddingTop: '1.5rem',
      borderTop: '1px solid #374151',
      textAlign: 'center'
    },
    registerLink: {
      color: '#9ca3af'
    },
    registerLinkAccent: {
      color: '#10b981',
      textDecoration: 'none',
      fontWeight: '600'
    },
    helpCard: {
      backgroundColor: '#1f2937',
      padding: '1rem',
      borderRadius: '0.5rem',
      border: '1px solid #374151',
      marginTop: '1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem'
    },
    helpIcon: {
      color: '#3b82f6',
      fontSize: '1.25rem',
      marginTop: '0.25rem'
    },
    helpContent: {
      flex: 1
    },
    helpTitle: {
      color: 'white',
      fontWeight: '500',
      fontSize: '0.875rem',
      marginBottom: '0.25rem'
    },
    helpText: {
      color: '#9ca3af',
      fontSize: '0.75rem'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>
              🧭
            </div>
            <span style={styles.logoText}>ESG Compass</span>
          </div>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <div style={styles.form}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={styles.errorAlert}>
                <span style={styles.errorIcon}>⚠️</span>
                <span style={styles.errorText}>{error}</span>
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.rememberSection}>
              <label style={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  style={styles.checkbox}
                />
                <span>Remember me</span>
              </label>
              <button type="button" style={styles.forgotLink}>
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                ...(loading ? styles.submitButtonDisabled : {})
              }}
            >
              {loading ? (
                <>
                  <div style={styles.spinner}></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>🔐</span>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.registerLink}>
              Don't have an account?{' '}
              <Link to="/register" style={styles.registerLinkAccent}>
                Sign up
              </Link>
            </span>
          </div>
        </div>

        {/* Help Section */}
        <div style={styles.helpCard}>
          <span style={styles.helpIcon}>💡</span>
          <div style={styles.helpContent}>
            <h4 style={styles.helpTitle}>Need help?</h4>
            <p style={styles.helpText}>
              Contact our support team if you're having trouble accessing your account.
            </p>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default Login