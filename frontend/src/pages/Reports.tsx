import { useState, useEffect } from 'react'
import { reportsAPI, authAPI } from '../utils/api'

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('esg-overview')
  const [isGenerating, setIsGenerating] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Get current user's company ID
  useEffect(() => {
    const getCurrentUserCompany = async () => {
      try {
        const response = await authAPI.getCurrentUser()
        setCompanyId(response.data.company_id)
      } catch (err) {
        console.error('Failed to get current user:', err)
        setError('Failed to get user information')
      }
    }
    getCurrentUserCompany()
  }, [])

  const reportTypes = [
    { id: 'esg-overview', name: 'ESG Overview Report', description: 'Complete ESG performance summary' },
    { id: 'dst-compliance', name: 'Dubai Sustainable Tourism', description: 'DST compliance report' },
    { id: 'green-key', name: 'Green Key Certification', description: 'Green Key application report' },
    { id: 'carbon-footprint', name: 'Carbon Footprint Report', description: 'Detailed emissions analysis' },
    { id: 'social-impact', name: 'Social Impact Report', description: 'Community and employee metrics' },
  ]

  const handleGenerateReport = async () => {
    if (!companyId) {
      alert('Error: Company information not available. Please try refreshing the page.')
      return
    }

    setIsGenerating(true)
    setError(null)
    
    try {
      console.log('🚀 Generating ESG report for company:', companyId)
      
      // Generate the report
      const response = await reportsAPI.generateESGReport(companyId, true)
      console.log('✅ Report generated successfully')
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      link.download = `ESG_Report_${timestamp}.pdf`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      console.log('📥 Download triggered successfully')
      
    } catch (err: any) {
      console.error('❌ Failed to generate report:', err)
      setError(err.response?.data?.detail || 'Failed to generate report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
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
      marginBottom: '2rem'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      color: 'white'
    },
    subtitle: {
      fontSize: '1rem',
      color: '#9ca3af'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gap: '2rem',
      marginBottom: '2rem'
    },
    sidebar: {
      backgroundColor: '#1f2937',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151'
    },
    sidebarTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'white',
      marginBottom: '1rem'
    },
    reportTypeButton: {
      width: '100%',
      textAlign: 'left',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      marginBottom: '0.5rem',
      transition: 'all 0.2s ease'
    },
    reportTypeActive: {
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      border: '1px solid rgba(16, 185, 129, 0.5)',
      color: 'white'
    },
    reportTypeInactive: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: '#9ca3af'
    },
    reportName: {
      fontSize: '0.875rem',
      fontWeight: '500',
      marginBottom: '0.25rem'
    },
    reportDescription: {
      fontSize: '0.75rem',
      opacity: 0.8
    },
    mainCard: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151'
    },
    mainTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'white',
      marginBottom: '0.5rem'
    },
    mainDescription: {
      fontSize: '0.875rem',
      color: '#9ca3af',
      marginBottom: '2rem'
    },
    contentSection: {
      marginBottom: '2rem'
    },
    sectionTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: 'white',
      marginBottom: '1rem'
    },
    contentCard: {
      border: '1px solid #374151',
      borderRadius: '0.5rem',
      padding: '1rem'
    },
    contentRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '0.5rem',
      paddingBottom: '0.5rem',
      fontSize: '0.875rem'
    },
    contentLabel: {
      color: '#9ca3af'
    },
    statusReady: {
      color: '#10b981'
    },
    statusPending: {
      color: '#f59e0b'
    },
    optionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem',
      marginBottom: '2rem'
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      color: 'white'
    },
    generateButton: {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    generateButtonActive: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    generateButtonDisabled: {
      backgroundColor: '#374151',
      color: '#9ca3af',
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
    recentCard: {
      backgroundColor: '#1f2937',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151'
    },
    recentItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '0.5rem',
      marginBottom: '0.75rem'
    },
    recentItemContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    recentIcon: {
      fontSize: '1.25rem',
      color: '#ef4444'
    },
    recentTitle: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'white',
      marginBottom: '0.25rem'
    },
    recentDate: {
      fontSize: '0.75rem',
      color: '#9ca3af'
    },
    downloadButton: {
      color: '#10b981',
      textDecoration: 'none',
      fontSize: '0.875rem',
      cursor: 'pointer'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📄 Reports Hub</h1>
        <p style={styles.subtitle}>Generate ESG reports for compliance and certification</p>
      </div>

      <div style={styles.grid}>
        {/* Report Types Sidebar */}
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>📊 Report Types</h3>
          <div>
            {reportTypes.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                style={{
                  ...styles.reportTypeButton,
                  ...(selectedReport === report.id ? styles.reportTypeActive : styles.reportTypeInactive)
                }}
              >
                <div style={styles.reportName}>{report.name}</div>
                <div style={styles.reportDescription}>{report.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Report Preview */}
        <div style={styles.mainCard}>
          {selectedReport && (
            <>
              <div>
                <h3 style={styles.mainTitle}>
                  {reportTypes.find(r => r.id === selectedReport)?.name}
                </h3>
                <p style={styles.mainDescription}>
                  {reportTypes.find(r => r.id === selectedReport)?.description}
                </p>
              </div>

              {/* Report Contents */}
              <div style={styles.contentSection}>
                <h4 style={styles.sectionTitle}>📋 Report Contents</h4>
                <div style={styles.contentCard}>
                  <div style={styles.contentRow}>
                    <span style={styles.contentLabel}>Executive Summary</span>
                    <span style={styles.statusReady}>✅ Ready</span>
                  </div>
                  <div style={styles.contentRow}>
                    <span style={styles.contentLabel}>ESG Scores & Metrics</span>
                    <span style={styles.statusReady}>✅ Ready</span>
                  </div>
                  <div style={styles.contentRow}>
                    <span style={styles.contentLabel}>Compliance Status</span>
                    <span style={styles.statusReady}>✅ Ready</span>
                  </div>
                  <div style={styles.contentRow}>
                    <span style={styles.contentLabel}>Supporting Evidence</span>
                    <span style={styles.statusPending}>⚠️ 3 items pending</span>
                  </div>
                  <div style={styles.contentRow}>
                    <span style={styles.contentLabel}>Recommendations</span>
                    <span style={styles.statusReady}>✅ Ready</span>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div style={styles.contentSection}>
                <h4 style={styles.sectionTitle}>⚙️ Export Options</h4>
                <div style={styles.optionsGrid}>
                  <label style={styles.checkbox}>
                    <input type="checkbox" defaultChecked />
                    <span>📊 Include charts & graphs</span>
                  </label>
                  <label style={styles.checkbox}>
                    <input type="checkbox" defaultChecked />
                    <span>📎 Detailed evidence</span>
                  </label>
                  <label style={styles.checkbox}>
                    <input type="checkbox" />
                    <span>📋 Executive summary only</span>
                  </label>
                  <label style={styles.checkbox}>
                    <input type="checkbox" defaultChecked />
                    <span>🏢 Company branding</span>
                  </label>
                </div>
              </div>

              {/* Generate Button */}
              <div>
                <button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  style={{
                    ...styles.generateButton,
                    ...(isGenerating ? styles.generateButtonDisabled : styles.generateButtonActive)
                  }}
                >
                  {isGenerating ? (
                    <>
                      <div style={styles.spinner}></div>
                      <span>Generating Report...</span>
                    </>
                  ) : (
                    <>
                      <span>📥</span>
                      <span>Generate Report</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  color: '#dc2626'
                }}>
                  ❌ {error}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <div style={styles.recentCard}>
        <h3 style={styles.sidebarTitle}>📚 Recent Reports</h3>
        <div>
          <div style={styles.recentItem}>
            <div style={styles.recentItemContent}>
              <span style={styles.recentIcon}>📄</span>
              <div>
                <div style={styles.recentTitle}>ESG Overview Report - Q4 2024</div>
                <div style={styles.recentDate}>Generated 2 days ago</div>
              </div>
            </div>
            <button style={styles.downloadButton}>
              📥 Download
            </button>
          </div>
          <div style={styles.recentItem}>
            <div style={styles.recentItemContent}>
              <span style={styles.recentIcon}>📄</span>
              <div>
                <div style={styles.recentTitle}>Dubai Sustainable Tourism Report</div>
                <div style={styles.recentDate}>Generated 1 week ago</div>
              </div>
            </div>
            <button style={styles.downloadButton}>
              📥 Download
            </button>
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

export default Reports