
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #374151'
    },
    nav: {
      maxWidth: '80rem',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    logoIcon: {
      width: '2.5rem',
      height: '2.5rem',
      backgroundColor: '#10b981',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    logoText: {
      fontSize: '1.25rem',
      fontWeight: 'bold'
    },
    navLinks: {
      display: 'flex',
      alignItems: 'center',
      gap: '2rem'
    },
    navLink: {
      color: '#d1d5db',
      textDecoration: 'none',
      cursor: 'pointer'
    },
    demoButton: {
      backgroundColor: '#10b981',
      color: 'white',
      padding: '0.5rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer'
    },
    main: {
      padding: '4rem 1.5rem'
    },
    container: {
      maxWidth: '80rem',
      margin: '0 auto'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '4rem',
      alignItems: 'center'
    },
    title: {
      fontSize: '3rem',
      fontWeight: 'bold',
      marginBottom: '1.5rem',
      lineHeight: '1.2'
    },
    titleHighlight: {
      color: '#10b981'
    },
    subtitle: {
      fontSize: '1.25rem',
      color: '#d1d5db',
      marginBottom: '2rem',
      lineHeight: '1.6'
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap'
    },
    primaryButton: {
      backgroundColor: '#10b981',
      color: 'white',
      padding: '0.75rem 2rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    secondaryButton: {
      border: '1px solid #6b7280',
      backgroundColor: 'transparent',
      color: 'white',
      padding: '0.75rem 2rem',
      borderRadius: '0.5rem',
      fontWeight: '500',
      cursor: 'pointer'
    },
    dashboard: {
      backgroundColor: '#1f2937',
      borderRadius: '1rem',
      padding: '2rem',
      border: '1px solid #374151'
    },
    dashboardTitle: {
      textAlign: 'center',
      marginBottom: '2rem'
    },
    scoreCircle: {
      position: 'relative',
      width: '8rem',
      height: '8rem',
      margin: '0 auto 1rem'
    },
    scoreText: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#10b981'
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1rem',
      marginBottom: '2rem'
    },
    metricCard: {
      textAlign: 'center'
    },
    metricIcon: {
      width: '3rem',
      height: '3rem',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 0.5rem'
    },
    metricValue: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '0.25rem'
    },
    metricLabel: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    chartContainer: {
      marginBottom: '1.5rem'
    },
    chartHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    chart: {
      display: 'flex',
      alignItems: 'end',
      justifyContent: 'space-between',
      height: '4rem',
      gap: '0.25rem'
    },
    chartBar: {
      backgroundColor: '#10b981',
      borderRadius: '2px 2px 0 0',
      flex: 1
    },
    chartLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.75rem',
      color: '#9ca3af',
      marginTop: '0.5rem'
    },
    recommendations: {
      marginTop: '1rem'
    },
    recommendationItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.5rem'
    },
    dot: {
      width: '0.5rem',
      height: '0.5rem',
      borderRadius: '50%'
    },
    featuresSection: {
      padding: '4rem 1.5rem',
      backgroundColor: '#1f2937'
    },
    sectionTitle: {
      textAlign: 'center',
      marginBottom: '3rem'
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '2rem'
    },
    featureCard: {
      backgroundColor: '#111827',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      border: '1px solid #374151'
    },
    featureIcon: {
      width: '4rem',
      height: '4rem',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1rem'
    },
    ctaSection: {
      padding: '4rem 1.5rem',
      textAlign: 'center'
    },
    footer: {
      padding: '3rem 1.5rem',
      borderTop: '1px solid #374151'
    },
    footerGrid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr',
      gap: '2rem',
      marginBottom: '2rem'
    },
    footerBottom: {
      borderTop: '1px solid #374151',
      paddingTop: '2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '0.875rem',
      color: '#9ca3af'
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <nav style={styles.nav}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              ✓
            </div>
            <span style={styles.logoText}>ESG Compass</span>
          </div>
          
          <div style={styles.navLinks}>
            <a href="#features" style={styles.navLink}>Features</a>
            <a href="#pricing" style={styles.navLink}>Pricing</a>
            <a href="#resources" style={styles.navLink}>Resources</a>
            <button 
              onClick={() => handleNavigation('/login')}
              style={{...styles.navLink, background: 'none', border: 'none', cursor: 'pointer'}}
            >
              Login
            </button>
            <button 
              onClick={() => handleNavigation('/register')}
              style={styles.demoButton}
            >
              Request Demo
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.container as React.CSSProperties}>
          <div style={styles.grid}>
            {/* Left Side - Content */}
            <div>
              <h1 style={styles.title}>
                ESG<br />
                Assessment<br />
                <span style={styles.titleHighlight}>Made Simple</span>
              </h1>
              <p style={styles.subtitle}>
                Help your UAE SME understand, track, and report Environmental, Social & Governance metrics 
                without the jargon. Comply with Dubai Sustainable Tourism, Green Key, and Net-Zero 2050 requirements.
              </p>
              <div style={styles.buttonGroup as React.CSSProperties}>
                <button 
                  onClick={() => handleNavigation('/register')}
                  style={styles.primaryButton}
                >
                  ▶ Request Demo
                </button>
                <button style={styles.secondaryButton}>
                  Learn More
                </button>
              </div>
            </div>

            {/* Right Side - Dashboard Preview */}
            <div style={styles.dashboard as React.CSSProperties}>
              {/* Overall ESG Score */}
              <div style={styles.dashboardTitle as React.CSSProperties}>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: '#d1d5db', marginBottom: '1.5rem'}}>
                  Overall ESG Score
                </h3>
                {/* @ts-ignore: Allow custom CSS variable if used in styles.scoreCircle */}
                <div style={styles.scoreCircle as React.CSSProperties}>
                  <svg width="128" height="128" style={{transform: 'rotate(-90deg)'}}>
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#374151"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#10b981"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${75 * 3.5} ${100 * 3.5}`}
                    />
                  </svg>
                  <div style={styles.scoreText as React.CSSProperties}>75</div>
                </div>
                <p style={{fontSize: '0.875rem', color: '#9ca3af'}}>Above Industry Average</p>
              </div>

              {/* ESG Breakdown */}
              <div style={styles.metricsGrid as React.CSSProperties}>
                <div style={styles.metricCard as React.CSSProperties}>
                  <div style={{...styles.metricIcon, backgroundColor: 'rgba(16, 185, 129, 0.2)'}}>
                    <span style={{color: '#10b981', fontSize: '1.5rem'}}>🌱</span>
                  </div>
                  <div style={{...styles.metricValue, color: '#10b981'}}>72</div>
                  <div style={styles.metricLabel}>Environmental</div>
                </div>
                <div style={styles.metricCard as React.CSSProperties}>
                  <div style={{...styles.metricIcon, backgroundColor: 'rgba(59, 130, 246, 0.2)'}}>
                    <span style={{color: '#3b82f6', fontSize: '1.5rem'}}>👥</span>
                  </div>
                  <div style={{...styles.metricValue, color: '#3b82f6'}}>78</div>
                  <div style={styles.metricLabel}>Social</div>
                </div>
                <div style={styles.metricCard as React.CSSProperties}>
                  <div style={{...styles.metricIcon, backgroundColor: 'rgba(168, 85, 247, 0.2)'}}>
                    <span style={{color: '#a855f7', fontSize: '1.5rem'}}>⚖️</span>
                  </div>
                  <div style={{...styles.metricValue, color: '#a855f7'}}>75</div>
                  <div style={styles.metricLabel}>Governance</div>
                </div>
              </div>

              {/* Emissions Trend */}
              <div style={styles.chartContainer}>
                <div style={styles.chartHeader}>
                  <h4 style={{fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db'}}>
                    Emissions Trend (12 months)
                  </h4>
                  <span style={{fontSize: '0.875rem', color: '#10b981'}}>-15% reduction</span>
                </div>
                <div style={styles.chart}>
                  {[0.6, 0.8, 0.5, 0.7, 0.9, 0.4, 0.6, 0.3, 0.5, 0.2, 0.4, 0.1].map((height, index) => (
                    <div
                      key={index}
                      style={{...styles.chartBar, height: `${height * 100}%`}}
                    />
                  ))}
                </div>
                <div style={styles.chartLabels}>
                  <span>Jan</span>
                  <span>Dec</span>
                </div>
              </div>

              {/* Top Recommendations */}
              <div style={styles.recommendations}>
                <h4 style={{fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '0.75rem'}}>
                  Top Recommendations
                </h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  <div style={styles.recommendationItem}>
                    <div style={{...styles.dot, backgroundColor: '#10b981'}}></div>
                    <span style={{fontSize: '0.875rem', color: '#9ca3af'}}>Switch to renewable energy sources</span>
                  </div>
                  <div style={styles.recommendationItem}>
                    <div style={{...styles.dot, backgroundColor: '#3b82f6'}}></div>
                    <span style={{fontSize: '0.875rem', color: '#9ca3af'}}>Implement employee wellness program</span>
                  </div>
                  <div style={styles.recommendationItem}>
                    <div style={{...styles.dot, backgroundColor: '#a855f7'}}></div>
                    <span style={{fontSize: '0.875rem', color: '#9ca3af'}}>Update board diversity policy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <div style={styles.container as React.CSSProperties}>
          <div style={styles.sectionTitle as React.CSSProperties}>
            <h2 style={{fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '1rem'}}>
              Comprehensive ESG Solutions
            </h2>
            <p style={{fontSize: '1.25rem', color: '#d1d5db'}}>
              Everything you need to achieve ESG compliance and drive sustainable business growth
            </p>
          </div>
          
          <div style={styles.featuresGrid}>
            {[
              {
                icon: '🌱',
                title: 'Environmental Excellence',
                description: 'AI-powered carbon tracking, energy optimization, and automated environmental reporting',
                color: '#10b981'
              },
              {
                icon: '👥',
                title: 'Social Impact',
                description: 'Comprehensive employee welfare and community engagement management',
                color: '#3b82f6'
              },
              {
                icon: '⚖️',
                title: 'Governance Framework',
                description: 'Ensure transparency, ethics, and regulatory compliance across operations',
                color: '#a855f7'
              }
            ].map((feature, index) => (
              <div key={index} style={styles.featureCard as React.CSSProperties}>
                <div style={{...styles.featureIcon, backgroundColor: `${feature.color}33`}}>
                  <span style={{fontSize: '2rem'}}>{feature.icon}</span>
                </div>
                <h3 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem'}}>{feature.title}</h3>
                <p style={{color: '#d1d5db'}}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection as React.CSSProperties}>
        <div style={{maxWidth: '64rem', margin: '0 auto'}}>
          <h2 style={{fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '1.5rem'}}>
            Ready to Lead in Sustainability?
          </h2>
          <p style={{fontSize: '1.25rem', color: '#d1d5db', marginBottom: '2rem'}}>
            Join the revolution of UAE SMEs who are not just meeting ESG requirements, but exceeding them.
          </p>
          <div style={styles.buttonGroup as React.CSSProperties}>
            <button 
              onClick={() => handleNavigation('/register')}
              style={styles.primaryButton}
            >
              Start Free Trial
            </button>
            <button style={styles.secondaryButton}>
              Schedule Consultation
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer as React.CSSProperties}>
        <div style={styles.container as React.CSSProperties}>
          <div style={styles.footerGrid as React.CSSProperties}>
            <div>
              <div style={{...styles.logo, marginBottom: '1rem'}}>
                <div style={{...styles.logoIcon, width: '2rem', height: '2rem'}}>
                  ✓
                </div>
                <span style={{fontSize: '1.125rem', fontWeight: 'bold'}}>ESG Compass</span>
              </div>
              <p style={{color: '#9ca3af', marginBottom: '1rem'}}>
                Empowering UAE SMEs to achieve ESG excellence through innovative technology and expert guidance.
              </p>
            </div>
            
            <div>
              <h4 style={{fontWeight: '600', marginBottom: '1rem'}}>Solutions</h4>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#9ca3af'}}>
                <a href="#" style={{color: '#9ca3af', textDecoration: 'none'}}>Environmental Tracking</a>
                <a href="#" style={{color: '#9ca3af', textDecoration: 'none'}}>Social Impact</a>
                <a href="#" style={{color: '#9ca3af', textDecoration: 'none'}}>Governance Framework</a>
              </div>
            </div>
            
            <div>
              <h4 style={{fontWeight: '600', marginBottom: '1rem'}}>Support</h4>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#9ca3af'}}>
                <a href="#" style={{color: '#9ca3af', textDecoration: 'none'}}>Documentation</a>
                <a href="#" style={{color: '#9ca3af', textDecoration: 'none'}}>Contact Support</a>
                <a href="#" style={{color: '#9ca3af', textDecoration: 'none'}}>Training Center</a>
              </div>
            </div>
          </div>
          
          <div style={styles.footerBottom as React.CSSProperties}>
            <div>© 2024 ESG Compass. All rights reserved.</div>
            <div style={{display: 'flex', gap: '1.5rem'}}>
              <a href="#" style={{color: '#9ca3af', textDecoration: 'none'}}>Privacy Policy</a>
              <a href="#" style={{color: '#9ca3af', textDecoration: 'none'}}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home