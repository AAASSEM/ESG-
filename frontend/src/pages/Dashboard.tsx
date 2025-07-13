import { useState, useEffect } from 'react'
import { taskStorage } from '../services/taskStorage'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [progressStats, setProgressStats] = useState({
    overall: { completed: 0, total: 0, percentage: 0 },
    environmental: { completed: 0, total: 0, percentage: 0 },
    social: { completed: 0, total: 0, percentage: 0 },
    governance: { completed: 0, total: 0, percentage: 0 },
    evidence: { uploaded: 0, required: 0, percentage: 0 }
  })

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
  
  const esgScores = {
    overallScore: progressStats.overall.percentage,
    environmental: progressStats.environmental.percentage,
    social: progressStats.social.percentage,
    governance: progressStats.governance.percentage
  }

  const styles: { [key: string]: React.CSSProperties } = {
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
    headerButtons: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem'
    },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    primaryButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#374151',
      color: 'white'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1.5rem',
      marginBottom: '3rem'
    },
    statCard: {
      backgroundColor: '#1f2937',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      textAlign: 'center'
    },
    statValue: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    statLabel: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    tabsContainer: {
      backgroundColor: '#1f2937',
      padding: '0.5rem',
      borderRadius: '0.75rem',
      marginBottom: '2rem',
      display: 'inline-flex',
      gap: '0.5rem'
    },
    tab: {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    activeTab: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    inactiveTab: {
      backgroundColor: 'transparent',
      color: '#9ca3af'
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '3rem'
    },
    metricCard: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      textAlign: 'center'
    },
    metricIcon: {
      fontSize: '3rem',
      marginBottom: '1rem'
    },
    metricTitle: {
      fontSize: '0.875rem',
      color: '#9ca3af',
      marginBottom: '0.5rem'
    },
    metricValue: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    metricChange: {
      fontSize: '0.875rem',
      fontWeight: '500',
      marginBottom: '1rem'
    },
    progressBar: {
      width: '100%',
      height: '0.5rem',
      backgroundColor: '#374151',
      borderRadius: '0.25rem',
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      borderRadius: '0.25rem'
    },
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '2rem',
      marginBottom: '3rem'
    },
    chartCard: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151'
    },
    chartTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      marginBottom: '1rem'
    },
    chart: {
      display: 'flex',
      alignItems: 'end',
      justifyContent: 'space-between',
      height: '12rem',
      marginBottom: '1rem',
      gap: '0.5rem'
    },
    chartBar: {
      backgroundColor: '#10b981',
      borderRadius: '0.25rem 0.25rem 0 0',
      flex: 1
    },
    chartLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    goalsContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    },
    goalItem: {
      backgroundColor: '#111827',
      padding: '1rem',
      borderRadius: '0.5rem',
      border: '1px solid #374151'
    },
    goalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem'
    },
    goalTitle: {
      fontSize: '1rem',
      fontWeight: '500'
    },
    goalProgress: {
      fontSize: '1.25rem',
      fontWeight: 'bold'
    },
    goalTarget: {
      fontSize: '0.875rem',
      color: '#9ca3af',
      marginBottom: '0.5rem'
    },
    activityContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    },
    activityItem: {
      backgroundColor: '#111827',
      padding: '1rem',
      borderRadius: '0.5rem',
      border: '1px solid #374151',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    activityIcon: {
      fontSize: '1.5rem',
      width: '3rem',
      height: '3rem',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    activityContent: {
      flex: 1
    },
    activityTitle: {
      fontSize: '1rem',
      fontWeight: '500',
      marginBottom: '0.25rem'
    },
    activitySubtitle: {
      fontSize: '0.875rem',
      color: '#9ca3af',
      marginBottom: '0.25rem'
    },
    activityTime: {
      fontSize: '0.75rem',
      color: '#6b7280'
    }
  }

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <h1 style={styles.title}>ESG Dashboard</h1>
        <p style={styles.subtitle}>Monitor your sustainability performance and track progress toward your goals</p>
        
        <div style={styles.headerButtons}>
          <button style={{...styles.button, ...styles.secondaryButton}}>
            📊 Export Report
          </button>
          <button style={{...styles.button, ...styles.primaryButton}}>
            ➕ Add Data
          </button>
        </div>
        
        {/* Quick Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{...styles.statValue, color: '#10b981'}}>98%</div>
            <div style={styles.statLabel}>Compliance Rate</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statValue, color: '#3b82f6'}}>15</div>
            <div style={styles.statLabel}>Active Goals</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statValue, color: '#a855f7'}}>24</div>
            <div style={styles.statLabel}>Tasks This Week</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statValue, color: '#10b981'}}>-12%</div>
            <div style={styles.statLabel}>Carbon Reduction</div>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div style={styles.tabsContainer}>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'environmental', label: 'Environmental', icon: '🌱' },
          { id: 'social', label: 'Social', icon: '👥' },
          { id: 'governance', label: 'Governance', icon: '⚖️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.activeTab : styles.inactiveTab)
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Key Metrics */}
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <div style={styles.metricIcon}>📊</div>
              <div style={styles.metricTitle}>Overall ESG Score</div>
              <div style={{...styles.metricValue, color: '#10b981'}}>{esgScores.overallScore}</div>
              <div style={{...styles.metricChange, color: '#10b981'}}>↑ +5 this month</div>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, backgroundColor: '#10b981', width: `${esgScores.overallScore}%`}}></div>
              </div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricIcon}>🌱</div>
              <div style={styles.metricTitle}>Environmental</div>
              <div style={{...styles.metricValue, color: '#10b981'}}>{esgScores.environmental}</div>
              <div style={{...styles.metricChange, color: '#10b981'}}>↑ +8 this month</div>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, backgroundColor: '#10b981', width: `${esgScores.environmental}%`}}></div>
              </div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricIcon}>👥</div>
              <div style={styles.metricTitle}>Social</div>
              <div style={{...styles.metricValue, color: '#3b82f6'}}>{esgScores.social}</div>
              <div style={{...styles.metricChange, color: '#3b82f6'}}>↑ +3 this month</div>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, backgroundColor: '#3b82f6', width: `${esgScores.social}%`}}></div>
              </div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricIcon}>⚖️</div>
              <div style={styles.metricTitle}>Governance</div>
              <div style={{...styles.metricValue, color: '#a855f7'}}>{esgScores.governance}</div>
              <div style={{...styles.metricChange, color: '#a855f7'}}>↑ +2 this month</div>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, backgroundColor: '#a855f7', width: `${esgScores.governance}%`}}></div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div style={styles.chartsGrid}>
            {/* ESG Score Trend */}
            <div style={styles.chartCard}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                <h3 style={styles.chartTitle}>ESG Score Trend</h3>
                <button style={{...styles.button, ...styles.secondaryButton, padding: '0.5rem 1rem', fontSize: '0.875rem'}}>
                  📅 Last 12 Months
                </button>
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
                <span>Jan 2024</span>
                <span style={{color: '#10b981', fontWeight: '500'}}>+18% improvement</span>
                <span>Dec 2024</span>
              </div>
            </div>

            {/* Goals Progress */}
            <div style={styles.chartCard}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                <h3 style={styles.chartTitle}>Goals Progress</h3>
                <button style={{...styles.button, ...styles.primaryButton, padding: '0.5rem 1rem', fontSize: '0.875rem'}}>
                  ➕ Add Goal
                </button>
              </div>
              <div style={styles.goalsContainer}>
                {[
                  { goal: 'Reduce Carbon Emissions', progress: 87, color: '#10b981', target: '25% by 2025' },
                  { goal: 'Employee Training Hours', progress: 64, color: '#3b82f6', target: '40 hrs/employee' },
                  { goal: 'Board Gender Diversity', progress: 75, color: '#a855f7', target: '40% women' },
                  { goal: 'Renewable Energy Usage', progress: 42, color: '#10b981', target: '50% by 2026' }
                ].map((item, index) => (
                  <div key={index} style={styles.goalItem}>
                    <div style={styles.goalHeader}>
                      <div>
                        <div style={styles.goalTitle}>{item.goal}</div>
                        <div style={styles.goalTarget}>{item.target}</div>
                      </div>
                      <div style={{...styles.goalProgress, color: item.color}}>{item.progress}%</div>
                    </div>
                    <div style={styles.progressBar}>
                      <div style={{...styles.progressFill, backgroundColor: item.color, width: `${item.progress}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={styles.chartCard}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h3 style={styles.chartTitle}>Recent Activity</h3>
              <button style={{...styles.button, ...styles.secondaryButton, padding: '0.5rem 1rem', fontSize: '0.875rem'}}>
                View All
              </button>
            </div>
            <div style={styles.activityContainer}>
              {[
                {
                  icon: '📊',
                  color: '#10b981',
                  title: 'Energy consumption data uploaded',
                  subtitle: 'Q4 2024 electricity and gas usage',
                  time: '2 hours ago',
                  badge: 'Environmental'
                },
                {
                  icon: '📄',
                  color: '#3b82f6',
                  title: 'ESG report generated successfully',
                  subtitle: 'Annual sustainability report exported',
                  time: '1 day ago',
                  badge: 'Report'
                },
                {
                  icon: '👥',
                  color: '#a855f7',
                  title: 'Employee diversity metrics updated',
                  subtitle: 'New hire demographics added',
                  time: '2 days ago',
                  badge: 'Social'
                },
                {
                  icon: '📈',
                  color: '#10b981',
                  title: 'Carbon footprint calculation completed',
                  subtitle: 'Scope 1, 2, and 3 emissions analyzed',
                  time: '3 days ago',
                  badge: 'Environmental'
                }
              ].map((activity, index) => (
                <div key={index} style={styles.activityItem}>
                  <div style={{...styles.activityIcon, backgroundColor: `${activity.color}33`}}>
                    <span>{activity.icon}</span>
                  </div>
                  <div style={styles.activityContent}>
                    <div style={styles.activityTitle}>{activity.title}</div>
                    <div style={styles.activitySubtitle}>{activity.subtitle}</div>
                    <div style={styles.activityTime}>{activity.time}</div>
                  </div>
                  <div style={{fontSize: '0.875rem', color: activity.color, fontWeight: '500', padding: '0.25rem 0.5rem', backgroundColor: `${activity.color}33`, borderRadius: '0.25rem'}}>
                    {activity.badge}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Environmental Tab Content */}
      {activeTab === 'environmental' && (
        <div>
          <div style={styles.chartCard}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h3 style={styles.chartTitle}>Environmental Metrics</h3>
              <div style={{display: 'flex', gap: '0.5rem'}}>
                <button style={{...styles.button, ...styles.primaryButton, padding: '0.5rem 1rem', fontSize: '0.875rem'}}>
                  🧮 Carbon Calculator
                </button>
                <button style={{...styles.button, ...styles.secondaryButton, padding: '0.5rem 1rem', fontSize: '0.875rem'}}>
                  📊 Export Data
                </button>
              </div>
            </div>
            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <div style={styles.metricTitle}>Carbon Emissions</div>
                  <div style={{fontSize: '2rem'}}>☁️</div>
                </div>
                <div style={{...styles.metricValue, color: '#10b981'}}>245 <span style={{fontSize: '1.5rem'}}>tCO₂e</span></div>
                <div style={{...styles.metricChange, color: '#10b981'}}>↓ -12% this year</div>
                <div style={{fontSize: '0.875rem', color: '#9ca3af'}}>Target: 200 tCO₂e by 2025</div>
              </div>
              
              <div style={styles.metricCard}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <div style={styles.metricTitle}>Energy Consumption</div>
                  <div style={{fontSize: '2rem'}}>⚡</div>
                </div>
                <div style={{...styles.metricValue, color: '#10b981'}}>89,542 <span style={{fontSize: '1.5rem'}}>kWh</span></div>
                <div style={{...styles.metricChange, color: '#10b981'}}>↓ -8% this month</div>
                <div style={{fontSize: '0.875rem', color: '#9ca3af'}}>67% from renewable sources</div>
              </div>
              
              <div style={styles.metricCard}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <div style={styles.metricTitle}>Water Usage</div>
                  <div style={{fontSize: '2rem'}}>💧</div>
                </div>
                <div style={{...styles.metricValue, color: '#10b981'}}>12,890 <span style={{fontSize: '1.5rem'}}>L</span></div>
                <div style={{...styles.metricChange, color: '#10b981'}}>↓ -5% this month</div>
                <div style={{fontSize: '0.875rem', color: '#9ca3af'}}>15% recycled water used</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Tab Content */}
      {activeTab === 'social' && (
        <div>
          <div style={styles.chartCard}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h3 style={styles.chartTitle}>Social Impact Metrics</h3>
              <button style={{...styles.button, ...styles.secondaryButton, padding: '0.5rem 1rem', fontSize: '0.875rem'}}>
                📊 Employee Survey
              </button>
            </div>
            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <div style={styles.metricTitle}>Employee Satisfaction</div>
                  <div style={{fontSize: '2rem'}}>😊</div>
                </div>
                <div style={{...styles.metricValue, color: '#3b82f6'}}>4.2<span style={{fontSize: '1.5rem'}}>/5</span></div>
                <div style={{...styles.metricChange, color: '#3b82f6'}}>↑ +0.3 this quarter</div>
                <div style={{fontSize: '0.875rem', color: '#9ca3af'}}>Based on 156 responses</div>
              </div>
              
              <div style={styles.metricCard}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <div style={styles.metricTitle}>Training Hours</div>
                  <div style={{fontSize: '2rem'}}>🎓</div>
                </div>
                <div style={{...styles.metricValue, color: '#3b82f6'}}>1,245 <span style={{fontSize: '1.5rem'}}>hrs</span></div>
                <div style={{...styles.metricChange, color: '#3b82f6'}}>↑ +15% this year</div>
                <div style={{fontSize: '0.875rem', color: '#9ca3af'}}>32 hrs average per employee</div>
              </div>
              
              <div style={styles.metricCard}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <div style={styles.metricTitle}>Diversity Index</div>
                  <div style={{fontSize: '2rem'}}>🤝</div>
                </div>
                <div style={{...styles.metricValue, color: '#3b82f6'}}>78<span style={{fontSize: '1.5rem'}}>%</span></div>
                <div style={{...styles.metricChange, color: '#3b82f6'}}>↑ +5% this year</div>
                <div style={{fontSize: '0.875rem', color: '#9ca3af'}}>42% female leadership</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Governance Tab Content */}
      {activeTab === 'governance' && (
        <div>
          <div style={styles.chartCard}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h3 style={styles.chartTitle}>Governance Metrics</h3>
              <button style={{...styles.button, ...styles.primaryButton, padding: '0.5rem 1rem', fontSize: '0.875rem'}}>
                🛡️ Compliance Check
              </button>
            </div>
            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <div style={styles.metricTitle}>Board Independence</div>
                  <div style={{fontSize: '2rem'}}>⚖️</div>
                </div>
                <div style={{...styles.metricValue, color: '#a855f7'}}>67<span style={{fontSize: '1.5rem'}}>%</span></div>
                <div style={{...styles.metricChange, color: '#a855f7'}}>✓ Above benchmark</div>
                <div style={{fontSize: '0.875rem', color: '#9ca3af'}}>Industry average: 58%</div>
              </div>
              
              <div style={styles.metricCard}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <div style={styles.metricTitle}>Policy Compliance</div>
                  <div style={{fontSize: '2rem'}}>📋</div>
                </div>
                <div style={{...styles.metricValue, color: '#a855f7'}}>95<span style={{fontSize: '1.5rem'}}>%</span></div>
                <div style={{...styles.metricChange, color: '#a855f7'}}>↑ +2% this quarter</div>
                <div style={{fontSize: '0.875rem', color: '#9ca3af'}}>24 policies reviewed</div>
              </div>
              
              <div style={styles.metricCard}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <div style={styles.metricTitle}>Risk Management</div>
                  <div style={{fontSize: '2rem'}}>🛡️</div>
                </div>
                <div style={{...styles.metricValue, color: '#a855f7'}}>87<span style={{fontSize: '1.5rem'}}>%</span></div>
                <div style={{...styles.metricChange, color: '#a855f7'}}>⭐ Excellent rating</div>
                <div style={{fontSize: '0.875rem', color: '#9ca3af'}}>12 risks mitigated</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard