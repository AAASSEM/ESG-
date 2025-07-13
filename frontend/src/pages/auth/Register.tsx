import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    company_name: '',
    business_sector: ''
  })
  const [error, setError] = useState('')
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const businessSectors = [
    { value: 'hospitality', label: 'Hospitality & Tourism' },
    { value: 'construction', label: 'Construction & Real Estate' },
    { value: 'logistics', label: 'Logistics & Transportation' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'education', label: 'Education' },
    { value: 'health', label: 'Healthcare' },
    { value: 'other', label: 'Other' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    try {
      const { confirmPassword, ...registerData } = formData
      await register(registerData)
      navigate('/onboarding')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
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
      maxWidth: '32rem'
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
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
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
      transition: 'border-color 0.2s ease'
    },
    select: {
      width: '100%',
      padding: '0.75rem 1rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '1rem',
      outline: 'none',
      appearance: 'none',
      backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
      backgroundPosition: 'right 0.5rem center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '1.5em 1.5em'
    },
    option: {
      backgroundColor: '#1f2937',
      color: 'white'
    },
    helpText: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      marginTop: '0.25rem'
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
    termsSection: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      marginBottom: '1.5rem'
    },
    checkbox: {
      width: '1rem',
      height: '1rem',
      borderRadius: '0.25rem',
      border: '1px solid #4b5563',
      backgroundColor: '#374151',
      marginTop: '0.25rem'
    },
    termsText: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    termsLink: {
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
    loginLink: {
      color: '#9ca3af'
    },
    loginLinkAccent: {
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
          <h1 style={styles.title}>Create your account</h1>
          <p style={styles.subtitle}>Start your ESG compliance journey today</p>
        </div>

        {/* Registration Form */}
        <div style={styles.form}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={styles.errorAlert}>
                <span style={styles.errorIcon}>⚠️</span>
                <span style={styles.errorText}>{error}</span>
              </div>
            )}

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Company Name</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                placeholder="Enter your company name"
                style={styles.input}
                required
              />
              <p style={styles.helpText}>This will appear on your ESG reports and certificates</p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Business Sector</label>
              <select
                name="business_sector"
                value={formData.business_sector}
                onChange={handleInputChange}
                style={styles.select}
                required
              >
                <option value="">Select your business sector</option>
                {businessSectors.map((sector) => (
                  <option key={sector.value} value={sector.value} style={styles.option}>
                    {sector.label}
                  </option>
                ))}
              </select>
              <p style={styles.helpText}>Helps us apply relevant ESG frameworks and benchmarks</p>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.termsSection}>
              <input 
                type="checkbox" 
                style={styles.checkbox}
                required
              />
              <span style={styles.termsText}>
                I agree to the{' '}
                <button type="button" style={styles.termsLink}>
                  Terms of Service
                </button>{' '}
                and{' '}
                <button type="button" style={styles.termsLink}>
                  Privacy Policy
                </button>
              </span>
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
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>📝</span>
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.loginLink}>
              Already have an account?{' '}
              <Link to="/login" style={styles.loginLinkAccent}>
                Sign in
              </Link>
            </span>
          </div>
        </div>

        {/* Help Section */}
        <div style={styles.helpCard}>
          <span style={styles.helpIcon}>💡</span>
          <div style={styles.helpContent}>
            <h4 style={styles.helpTitle}>Get started in minutes</h4>
            <p style={styles.helpText}>
              Our onboarding wizard will guide you through setting up your ESG assessment based on your business sector.
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

export default Register