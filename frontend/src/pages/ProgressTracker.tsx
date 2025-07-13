import React, { useState, useEffect } from 'react'
import { taskStorage } from '../services/taskStorage'

const ProgressTracker = () => {
  const [progressStats, setProgressStats] = useState({
    overall: { completed: 0, total: 0, percentage: 0 },
    environmental: { completed: 0, total: 0, percentage: 0 },
    social: { completed: 0, total: 0, percentage: 0 },
    governance: { completed: 0, total: 0, percentage: 0 },
    evidence: { uploaded: 0, required: 0, percentage: 0 }
  })
  const [activeTab, setActiveTab] = useState('data')

  useEffect(() => {
    const loadProgressStats = () => {
      const stats = taskStorage.getProgressStats()
      setProgressStats(stats)
    }
    
    loadProgressStats()
    
    // Listen for task updates
    const handleTasksUpdated = () => {
      loadProgressStats()
    }
    
    window.addEventListener('tasksUpdated', handleTasksUpdated)
    window.addEventListener('storage', handleTasksUpdated)
    
    return () => {
      window.removeEventListener('tasksUpdated', handleTasksUpdated)
      window.removeEventListener('storage', handleTasksUpdated)
    }
  }, [])
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '2rem',
      marginBottom: '2rem'
    },
    card: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.5rem'
    },
    cardIcon: {
      width: '3rem',
      height: '3rem',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem'
    },
    cardTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'white',
      marginBottom: '0.25rem'
    },
    cardSubtitle: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    progressValue: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      marginBottom: '0.25rem'
    },
    progressLabel: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    progressBar: {
      width: '100%',
      height: '0.75rem',
      backgroundColor: '#374151',
      borderRadius: '0.375rem',
      overflow: 'hidden',
      marginBottom: '1rem'
    },
    progressFill: {
      height: '100%',
      borderRadius: '0.375rem',
      transition: 'width 0.5s ease'
    },
    categoryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1rem'
    },
    categoryItem: {
      textAlign: 'center'
    },
    categoryValue: {
      fontSize: '1.125rem',
      fontWeight: '600',
      marginBottom: '0.25rem'
    },
    categoryLabel: {
      fontSize: '0.75rem',
      color: '#9ca3af'
    },
    detailCard: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      marginBottom: '2rem'
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'white',
      marginBottom: '1.5rem'
    },
    tabButtons: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1.5rem'
    },
    tabButton: {
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    },
    tabButtonActive: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    tabButtonInactive: {
      backgroundColor: '#374151',
      color: '#9ca3af'
    },
    metricSection: {
      marginBottom: '2rem'
    },
    metricHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1rem'
    },
    metricIcon: {
      fontSize: '1.25rem',
      marginRight: '0.75rem'
    },
    metricTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: 'white'
    },
    metricProgress: {
      fontSize: '0.875rem',
      fontWeight: '600'
    },
    statusGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '1rem',
      marginLeft: '2rem',
      marginBottom: '1rem'
    },
    statusItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.75rem'
    },
    statusIcon: {
      fontSize: '0.875rem'
    },
    progressBarSmall: {
      width: '100%',
      height: '0.5rem',
      backgroundColor: '#374151',
      borderRadius: '0.25rem',
      overflow: 'hidden',
      marginLeft: '2rem'
    },
    nextStepsCard: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151'
    },
    stepItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      backgroundColor: '#111827',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
      border: '1px solid #374151'
    },
    stepIcon: {
      width: '2rem',
      height: '2rem',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1rem'
    },
    stepContent: {
      flex: 1
    },
    stepTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: 'white',
      marginBottom: '0.25rem'
    },
    stepDescription: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    stepButton: {
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📈 Progress Tracker</h1>
        <p style={styles.subtitle}>Track your ESG data completion and evidence upload progress</p>
      </div>

      {/* Progress Overview Cards */}
      <div style={styles.grid}>
        {/* Data Entered Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
              <div style={{...styles.cardIcon, backgroundColor: 'rgba(59, 130, 246, 0.2)'}}>
                <span style={{color: '#3b82f6'}}>📊</span>
              </div>
              <div>
                <h3 style={styles.cardTitle}>Data Entered</h3>
                <p style={styles.cardSubtitle}>ESG metrics completion</p>
              </div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{...styles.progressValue, color: '#3b82f6'}}>{progressStats.overall.percentage}%</div>
              <div style={styles.progressLabel}>{progressStats.overall.completed} of {progressStats.overall.total} tasks</div>
            </div>
          </div>
          
          <div>
            {/* Main Progress Bar */}
            <div style={styles.progressBar}>
              <div style={{...styles.progressFill, backgroundColor: '#3b82f6', width: `${progressStats.overall.percentage}%`}}></div>
            </div>
            
            {/* Category Breakdown */}
            <div style={styles.categoryGrid}>
              <div style={styles.categoryItem}>
                <div style={{...styles.categoryValue, color: '#10b981'}}>{progressStats.environmental.percentage}%</div>
                <div style={styles.categoryLabel}>🌱 Environmental</div>
              </div>
              <div style={styles.categoryItem}>
                <div style={{...styles.categoryValue, color: '#3b82f6'}}>{progressStats.social.percentage}%</div>
                <div style={styles.categoryLabel}>👥 Social</div>
              </div>
              <div style={styles.categoryItem}>
                <div style={{...styles.categoryValue, color: '#a855f7'}}>{progressStats.governance.percentage}%</div>
                <div style={styles.categoryLabel}>⚖️ Governance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Uploaded Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
              <div style={{...styles.cardIcon, backgroundColor: 'rgba(168, 85, 247, 0.2)'}}>
                <span style={{color: '#a855f7'}}>📤</span>
              </div>
              <div>
                <h3 style={styles.cardTitle}>Evidence Uploaded</h3>
                <p style={styles.cardSubtitle}>Supporting documents</p>
              </div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{...styles.progressValue, color: '#a855f7'}}>{progressStats.evidence.percentage}%</div>
              <div style={styles.progressLabel}>{progressStats.evidence.uploaded} of {progressStats.evidence.required} files</div>
            </div>
          </div>
          
          <div>
            {/* Main Progress Bar */}
            <div style={styles.progressBar}>
              <div style={{...styles.progressFill, backgroundColor: '#a855f7', width: `${progressStats.evidence.percentage}%`}}></div>
            </div>
            
            {/* Category Breakdown */}
            <div style={styles.categoryGrid}>
              <div style={styles.categoryItem}>
                <div style={{...styles.categoryValue, color: '#10b981'}}>
                  {(() => {
                    const envTasks = taskStorage.getTasksByCategory('environmental');
                    const envEvidence = envTasks.reduce((sum, t) => sum + (t.evidence_count || 0), 0);
                    const envRequired = envTasks.reduce((sum, t) => sum + (t.required_evidence || 0), 0);
                    return envRequired > 0 ? Math.round((envEvidence / envRequired) * 100) : 0;
                  })()}%
                </div>
                <div style={styles.categoryLabel}>🌱 Environmental</div>
              </div>
              <div style={styles.categoryItem}>
                <div style={{...styles.categoryValue, color: '#3b82f6'}}>
                  {(() => {
                    const socialTasks = taskStorage.getTasksByCategory('social');
                    const socialEvidence = socialTasks.reduce((sum, t) => sum + (t.evidence_count || 0), 0);
                    const socialRequired = socialTasks.reduce((sum, t) => sum + (t.required_evidence || 0), 0);
                    return socialRequired > 0 ? Math.round((socialEvidence / socialRequired) * 100) : 0;
                  })()}%
                </div>
                <div style={styles.categoryLabel}>👥 Social</div>
              </div>
              <div style={styles.categoryItem}>
                <div style={{...styles.categoryValue, color: '#a855f7'}}>
                  {(() => {
                    const govTasks = taskStorage.getTasksByCategory('governance');
                    const govEvidence = govTasks.reduce((sum, t) => sum + (t.evidence_count || 0), 0);
                    const govRequired = govTasks.reduce((sum, t) => sum + (t.required_evidence || 0), 0);
                    return govRequired > 0 ? Math.round((govEvidence / govRequired) * 100) : 0;
                  })()}%
                </div>
                <div style={styles.categoryLabel}>⚖️ Governance</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div style={styles.detailCard}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
          <h3 style={styles.sectionTitle}>Detailed Breakdown</h3>
          <div style={styles.tabButtons}>
            <button 
              onClick={() => setActiveTab('data')}
              style={{...styles.tabButton, ...(activeTab === 'data' ? styles.tabButtonActive : styles.tabButtonInactive)}}
            >
              📊 Data
            </button>
            <button 
              onClick={() => setActiveTab('evidence')}
              style={{...styles.tabButton, ...(activeTab === 'evidence' ? styles.tabButtonActive : styles.tabButtonInactive)}}
            >
              📄 Evidence
            </button>
          </div>
        </div>

        {activeTab === 'data' && (
          <div>
            {/* Environmental Metrics */}
            <div style={styles.metricSection}>
              <div style={styles.metricHeader}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <span style={{...styles.metricIcon, color: '#10b981'}}>🌱</span>
                  <span style={styles.metricTitle}>Environmental Tasks</span>
                </div>
                <span style={{...styles.metricProgress, color: '#10b981'}}>{progressStats.environmental.percentage}% Complete</span>
              </div>
              <div style={styles.statusGrid}>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#10b981'}}>✅</span>
                  <span style={{color: 'white'}}>Completed: {progressStats.environmental.completed}</span>
                </div>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#f59e0b'}}>⏳</span>
                  <span style={{color: '#9ca3af'}}>Remaining: {progressStats.environmental.total - progressStats.environmental.completed}</span>
                </div>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#3b82f6'}}>📊</span>
                  <span style={{color: 'white'}}>Total: {progressStats.environmental.total}</span>
                </div>
              </div>
              <div style={styles.progressBarSmall}>
                <div style={{...styles.progressFill, backgroundColor: '#10b981', width: `${progressStats.environmental.percentage}%`}}></div>
              </div>
            </div>

            {/* Social Metrics */}
            <div style={styles.metricSection}>
              <div style={styles.metricHeader}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <span style={{...styles.metricIcon, color: '#3b82f6'}}>👥</span>
                  <span style={styles.metricTitle}>Social Tasks</span>
                </div>
                <span style={{...styles.metricProgress, color: '#3b82f6'}}>{progressStats.social.percentage}% Complete</span>
              </div>
              <div style={styles.statusGrid}>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#10b981'}}>✅</span>
                  <span style={{color: 'white'}}>Completed: {progressStats.social.completed}</span>
                </div>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#f59e0b'}}>⏳</span>
                  <span style={{color: '#9ca3af'}}>Remaining: {progressStats.social.total - progressStats.social.completed}</span>
                </div>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#3b82f6'}}>📊</span>
                  <span style={{color: 'white'}}>Total: {progressStats.social.total}</span>
                </div>
              </div>
              <div style={styles.progressBarSmall}>
                <div style={{...styles.progressFill, backgroundColor: '#3b82f6', width: `${progressStats.social.percentage}%`}}></div>
              </div>
            </div>

            {/* Governance Metrics */}
            <div style={styles.metricSection}>
              <div style={styles.metricHeader}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <span style={{...styles.metricIcon, color: '#a855f7'}}>⚖️</span>
                  <span style={styles.metricTitle}>Governance Tasks</span>
                </div>
                <span style={{...styles.metricProgress, color: '#a855f7'}}>{progressStats.governance.percentage}% Complete</span>
              </div>
              <div style={styles.statusGrid}>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#10b981'}}>✅</span>
                  <span style={{color: 'white'}}>Completed: {progressStats.governance.completed}</span>
                </div>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#f59e0b'}}>⏳</span>
                  <span style={{color: '#9ca3af'}}>Remaining: {progressStats.governance.total - progressStats.governance.completed}</span>
                </div>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#3b82f6'}}>📊</span>
                  <span style={{color: 'white'}}>Total: {progressStats.governance.total}</span>
                </div>
              </div>
              <div style={styles.progressBarSmall}>
                <div style={{...styles.progressFill, backgroundColor: '#a855f7', width: `${progressStats.governance.percentage}%`}}></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div>
            {/* Environmental Evidence */}
            <div style={styles.metricSection}>
              <div style={styles.metricHeader}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <span style={{...styles.metricIcon, color: '#10b981'}}>🌱</span>
                  <span style={styles.metricTitle}>Environmental Evidence</span>
                </div>
                <span style={{...styles.metricProgress, color: '#10b981'}}>
                  {(() => {
                    const envTasks = taskStorage.getTasksByCategory('environmental');
                    const envEvidence = envTasks.reduce((sum, t) => sum + (t.evidence_count || 0), 0);
                    const envRequired = envTasks.reduce((sum, t) => sum + (t.required_evidence || 0), 0);
                    return envRequired > 0 ? Math.round((envEvidence / envRequired) * 100) : 0;
                  })()}% Complete
                </span>
              </div>
              <div style={styles.statusGrid}>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#10b981'}}>📤</span>
                  <span style={{color: 'white'}}>Uploaded: {(() => {
                    const envTasks = taskStorage.getTasksByCategory('environmental');
                    return envTasks.reduce((sum, t) => sum + (t.evidence_count || 0), 0);
                  })()}</span>
                </div>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#f59e0b'}}>📋</span>
                  <span style={{color: '#9ca3af'}}>Required: {(() => {
                    const envTasks = taskStorage.getTasksByCategory('environmental');
                    return envTasks.reduce((sum, t) => sum + (t.required_evidence || 0), 0);
                  })()}</span>
                </div>
              </div>
              <div style={styles.progressBarSmall}>
                <div style={{...styles.progressFill, backgroundColor: '#10b981', width: `${(() => {
                  const envTasks = taskStorage.getTasksByCategory('environmental');
                  const envEvidence = envTasks.reduce((sum, t) => sum + (t.evidence_count || 0), 0);
                  const envRequired = envTasks.reduce((sum, t) => sum + (t.required_evidence || 0), 0);
                  return envRequired > 0 ? Math.round((envEvidence / envRequired) * 100) : 0;
                })()}%`}}></div>
              </div>
            </div>

            {/* Social Evidence */}
            <div style={styles.metricSection}>
              <div style={styles.metricHeader}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <span style={{...styles.metricIcon, color: '#3b82f6'}}>👥</span>
                  <span style={styles.metricTitle}>Social Evidence</span>
                </div>
                <span style={{...styles.metricProgress, color: '#3b82f6'}}>
                  {(() => {
                    const socialTasks = taskStorage.getTasksByCategory('social');
                    const socialEvidence = socialTasks.reduce((sum, t) => sum + (t.evidence_count || 0), 0);
                    const socialRequired = socialTasks.reduce((sum, t) => sum + (t.required_evidence || 0), 0);
                    return socialRequired > 0 ? Math.round((socialEvidence / socialRequired) * 100) : 0;
                  })()}% Complete
                </span>
              </div>
              <div style={styles.statusGrid}>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#10b981'}}>📤</span>
                  <span style={{color: 'white'}}>Uploaded: {(() => {
                    const socialTasks = taskStorage.getTasksByCategory('social');
                    return socialTasks.reduce((sum, t) => sum + (t.evidence_count || 0), 0);
                  })()}</span>
                </div>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#f59e0b'}}>📋</span>
                  <span style={{color: '#9ca3af'}}>Required: {(() => {
                    const socialTasks = taskStorage.getTasksByCategory('social');
                    return socialTasks.reduce((sum, t) => sum + (t.required_evidence || 0), 0);
                  })()}</span>
                </div>
              </div>
              <div style={styles.progressBarSmall}>
                <div style={{...styles.progressFill, backgroundColor: '#3b82f6', width: `${(() => {
                  const socialTasks = taskStorage.getTasksByCategory('social');
                  const socialEvidence = socialTasks.reduce((sum, t) => sum + (t.evidence_count || 0), 0);
                  const socialRequired = socialTasks.reduce((sum, t) => sum + (t.required_evidence || 0), 0);
                  return socialRequired > 0 ? Math.round((socialEvidence / socialRequired) * 100) : 0;
                })()}%`}}></div>
              </div>
            </div>

            {/* Governance Evidence */}
            <div style={styles.metricSection}>
              <div style={styles.metricHeader}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <span style={{...styles.metricIcon, color: '#a855f7'}}>⚖️</span>
                  <span style={styles.metricTitle}>Governance Evidence</span>
                </div>
                <span style={{...styles.metricProgress, color: '#a855f7'}}>
                  {(() => {
                    const govTasks = taskStorage.getTasksByCategory('governance');
                    const govEvidence = govTasks.reduce((sum, t) => sum + (t.evidence_count || 0), 0);
                    const govRequired = govTasks.reduce((sum, t) => sum + (t.required_evidence || 0), 0);
                    return govRequired > 0 ? Math.round((govEvidence / govRequired) * 100) : 0;
                  })()}% Complete
                </span>
              </div>
              <div style={styles.statusGrid}>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#10b981'}}>📤</span>
                  <span style={{color: 'white'}}>Uploaded: {(() => {
                    const govTasks = taskStorage.getTasksByCategory('governance');
                    return govTasks.reduce((sum, t) => sum + (t.evidence_count || 0), 0);
                  })()}</span>
                </div>
                <div style={styles.statusItem}>
                  <span style={{...styles.statusIcon, color: '#f59e0b'}}>📋</span>
                  <span style={{color: '#9ca3af'}}>Required: {(() => {
                    const govTasks = taskStorage.getTasksByCategory('governance');
                    return govTasks.reduce((sum, t) => sum + (t.required_evidence || 0), 0);
                  })()}</span>
                </div>
              </div>
              <div style={styles.progressBarSmall}>
                <div style={{...styles.progressFill, backgroundColor: '#a855f7', width: `${(() => {
                  const govTasks = taskStorage.getTasksByCategory('governance');
                  const govEvidence = govTasks.reduce((sum, t) => sum + (t.evidence_count || 0), 0);
                  const govRequired = govTasks.reduce((sum, t) => sum + (t.required_evidence || 0), 0);
                  return govRequired > 0 ? Math.round((govEvidence / govRequired) * 100) : 0;
                })()}%`}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div style={styles.nextStepsCard}>
        <h3 style={styles.sectionTitle}>🎯 Next Steps</h3>
        <div>
          <div style={styles.stepItem}>
            <div style={{...styles.stepIcon, backgroundColor: 'rgba(239, 68, 68, 0.2)'}}>
              <span style={{color: '#ef4444'}}>❗</span>
            </div>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>Complete Carbon Emissions Data</div>
              <div style={styles.stepDescription}>Required for Environmental score calculation</div>
            </div>
            <button style={{...styles.stepButton, backgroundColor: '#10b981', color: 'white'}}>
              Continue
            </button>
          </div>
          
          <div style={styles.stepItem}>
            <div style={{...styles.stepIcon, backgroundColor: 'rgba(245, 158, 11, 0.2)'}}>
              <span style={{color: '#f59e0b'}}>📤</span>
            </div>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>Upload Supporting Documents</div>
              <div style={styles.stepDescription}>32 files needed for evidence completion</div>
            </div>
            <button style={{...styles.stepButton, backgroundColor: '#a855f7', color: 'white'}}>
              Upload
            </button>
          </div>

          <div style={styles.stepItem}>
            <div style={{...styles.stepIcon, backgroundColor: 'rgba(59, 130, 246, 0.2)'}}>
              <span style={{color: '#3b82f6'}}>📊</span>
            </div>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>Review Governance Policies</div>
              <div style={styles.stepDescription}>Ethics and risk management sections need attention</div>
            </div>
            <button style={{...styles.stepButton, backgroundColor: '#3b82f6', color: 'white'}}>
              Review
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgressTracker