import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const Onboarding = () => {
  const navigate = useNavigate()
  const [isStarting, setIsStarting] = useState(false)

  const handleContinueSetup = async () => {
    setIsStarting(true)
    // Simulate setup process
    setTimeout(() => {
      navigate('/onboarding/wizard')
    }, 1500)
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  const styles = {
    container: {
      padding: '2rem',
      backgroundColor: '#111827',
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      marginBottom: '3rem'
    },
    title: {
      fontSize: '3rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    subtitle: {
      fontSize: '1.5rem',
      color: '#9ca3af',
      marginBottom: '2rem'
    },
    mainContent: {
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gap: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    sidebar: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      height: 'fit-content',
      position: 'sticky' as const,
      top: '2rem'
    },
    sidebarHeader: {
      textAlign: 'center' as const,
      marginBottom: '2rem'
    },
    sidebarTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    sidebarSubtitle: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    stepsList: {
      marginBottom: '2rem'
    },
    step: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '1.5rem'
    },
    stepIcon: {
      width: '2rem',
      height: '2rem',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '0.75rem',
      fontSize: '0.875rem',
      fontWeight: '600'
    },
    stepActive: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    stepInactive: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: '#9ca3af'
    },
    stepContent: {
      flex: 1
    },
    stepTitle: {
      fontSize: '0.875rem',
      fontWeight: '500',
      marginBottom: '0.25rem'
    },
    stepDescription: {
      fontSize: '0.75rem',
      color: '#9ca3af'
    },
    stepLine: {
      width: '1px',
      height: '2rem',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      marginLeft: '1rem',
      marginBottom: '0.5rem'
    },
    progressSection: {
      marginTop: '1rem'
    },
    progressHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.75rem',
      color: '#9ca3af',
      marginBottom: '0.5rem'
    },
    progressBar: {
      width: '100%',
      height: '0.5rem',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '0.25rem',
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#10b981',
      borderRadius: '0.25rem',
      transition: 'width 0.3s ease',
      width: '25%'
    },
    contentArea: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151'
    },
    contentHeader: {
      marginBottom: '2rem'
    },
    contentTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    contentDescription: {
      color: '#9ca3af',
      lineHeight: '1.6'
    },
    infoCard: {
      backgroundColor: '#374151',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      border: '1px solid #4b5563',
      marginBottom: '2rem'
    },
    infoHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem'
    },
    infoIcon: {
      fontSize: '1.5rem',
      color: '#3b82f6',
      marginTop: '0.25rem'
    },
    infoContent: {},
    infoTitle: {
      fontSize: '0.875rem',
      fontWeight: '500',
      marginBottom: '0.5rem'
    },
    infoText: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      lineHeight: '1.5'
    },
    buttonSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem',
      paddingTop: '1.5rem'
    },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.75rem',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s ease'
    },
    primaryButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    primaryButtonHover: {
      backgroundColor: '#0d9668'
    },
    primaryButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      color: '#9ca3af',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    secondaryButtonHover: {
      color: 'white',
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    },
    spinner: {
      width: '1rem',
      height: '1rem',
      border: '2px solid transparent',
      borderTop: '2px solid currentColor',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>ESG Platform Setup</h1>
        <p style={styles.subtitle}>Configure your sustainability compliance journey</p>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Wizard Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.sidebarTitle}>Setup Wizard</h2>
            <p style={styles.sidebarSubtitle}>Step 1 of 4</p>
          </div>

          <div style={styles.stepsList}>
            <div style={styles.step}>
              <div style={{...styles.stepIcon, ...styles.stepActive}}>
                1
              </div>
              <div style={styles.stepContent}>
                <div style={{...styles.stepTitle, color: 'white'}}>Business Info</div>
                <div style={styles.stepDescription}>Company details</div>
              </div>
            </div>

            <div style={styles.stepLine}></div>

            <div style={styles.step}>
              <div style={{...styles.stepIcon, ...styles.stepInactive}}>
                2
              </div>
              <div style={styles.stepContent}>
                <div style={{...styles.stepTitle, color: '#9ca3af'}}>Locations</div>
                <div style={styles.stepDescription}>Sites & facilities</div>
              </div>
            </div>

            <div style={styles.stepLine}></div>

            <div style={styles.step}>
              <div style={{...styles.stepIcon, ...styles.stepInactive}}>
                3
              </div>
              <div style={styles.stepContent}>
                <div style={{...styles.stepTitle, color: '#9ca3af'}}>ESG Scoping</div>
                <div style={styles.stepDescription}>Data collection</div>
              </div>
            </div>

            <div style={styles.stepLine}></div>

            <div style={styles.step}>
              <div style={{...styles.stepIcon, ...styles.stepInactive}}>
                4
              </div>
              <div style={styles.stepContent}>
                <div style={{...styles.stepTitle, color: '#9ca3af'}}>Complete</div>
                <div style={styles.stepDescription}>Ready to go</div>
              </div>
            </div>
          </div>

          <div style={styles.progressSection}>
            <div style={styles.progressHeader}>
              <span>Progress</span>
              <span>25%</span>
            </div>
            <div style={styles.progressBar}>
              <div style={styles.progressFill}></div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={styles.contentArea}>
          <div style={styles.contentHeader}>
            <h1 style={styles.contentTitle}>Complete your company setup</h1>
            <p style={styles.contentDescription}>
              We'll help you configure your ESG assessment based on your business sector and location.
            </p>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoHeader}>
              <div style={styles.infoIcon}>💡</div>
              <div style={styles.infoContent}>
                <h4 style={styles.infoTitle}>Next Steps</h4>
                <p style={styles.infoText}>
                  Our setup wizard will guide you through UAE-specific ESG requirements. 
                  This process typically takes 10-15 minutes to complete.
                </p>
              </div>
            </div>
          </div>

          <div style={styles.buttonSection}>
            <button 
              onClick={handleContinueSetup}
              disabled={isStarting}
              style={{
                ...styles.button,
                ...styles.primaryButton,
                ...(isStarting ? styles.primaryButtonDisabled : {})
              }}
            >
              {isStarting ? (
                <>
                  <div style={styles.spinner}></div>
                  Setting up...
                </>
              ) : (
                <>
                  Continue Setup
                  <span>→</span>
                </>
              )}
            </button>
            <button 
              onClick={handleSkip}
              style={{...styles.button, ...styles.secondaryButton}}
            >
              Skip for Now
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Onboarding