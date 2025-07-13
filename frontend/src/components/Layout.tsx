import { ReactNode, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigationItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard', color: '#10b981' },
    { path: '/onboarding/wizard', icon: '🪄', label: 'Data Wizard', color: '#3b82f6' },
    { path: '/progress', icon: '📈', label: 'Progress Tracker', color: '#a855f7' },
    { path: '/tasks', icon: '✅', label: 'Task Management', color: '#10b981' },
    { path: '/reports', icon: '📄', label: 'Reports Hub', color: '#3b82f6' },
    { path: '/users', icon: '👥', label: 'User Management', color: '#a855f7' }
  ]

  const isActivePath = (path: string) => location.pathname === path

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #374151',
      backgroundColor: '#1f2937'
    },
    nav: {
      maxWidth: '80rem',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    logoSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    menuButton: {
      display: 'block',
      width: '2.5rem',
      height: '2.5rem',
      backgroundColor: '#374151',
      borderRadius: '0.5rem',
      border: 'none',
      color: '#9ca3af',
      cursor: 'pointer',
      fontSize: '1.25rem'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    logoIcon: {
      width: '3rem',
      height: '3rem',
      borderRadius: '1rem',
      background: 'linear-gradient(135deg, #10b981, #3b82f6)',
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
    logoSubtext: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      fontWeight: '500'
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    searchContainer: {
      position: 'relative',
      display: 'none'
    },
    searchInput: {
      width: '16rem',
      padding: '0.5rem 1rem 0.5rem 2.5rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '0.875rem',
      outline: 'none'
    },
    searchIcon: {
      position: 'absolute',
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af',
      fontSize: '0.875rem'
    },
    notificationButton: {
      position: 'relative',
      width: '2.5rem',
      height: '2.5rem',
      backgroundColor: '#374151',
      borderRadius: '0.5rem',
      border: 'none',
      color: '#9ca3af',
      cursor: 'pointer',
      fontSize: '1.25rem'
    },
    notificationDot: {
      position: 'absolute',
      top: '-0.25rem',
      right: '-0.25rem',
      width: '0.75rem',
      height: '0.75rem',
      backgroundColor: '#10b981',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    notificationDotInner: {
      width: '0.375rem',
      height: '0.375rem',
      backgroundColor: 'white',
      borderRadius: '50%'
    },
    userSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    userInfo: {
      textAlign: 'right',
      display: 'none'
    },
    userName: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'white'
    },
    userRole: {
      fontSize: '0.75rem',
      color: '#9ca3af'
    },
    userAvatar: {
      width: '2.5rem',
      height: '2.5rem',
      borderRadius: '0.5rem',
      background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.875rem',
      fontWeight: 'bold',
      color: 'white'
    },
    userActions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem'
    },
    userActionButton: {
      width: '1.5rem',
      height: '1.5rem',
      backgroundColor: '#374151',
      borderRadius: '0.375rem',
      border: 'none',
      color: '#9ca3af',
      cursor: 'pointer',
      fontSize: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    logoutButton: {
      width: '1.5rem',
      height: '1.5rem',
      backgroundColor: '#374151',
      borderRadius: '0.375rem',
      border: 'none',
      color: '#ef4444',
      cursor: 'pointer',
      fontSize: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    mainLayout: {
      display: 'flex'
    },
    sidebar: {
      width: isSidebarCollapsed ? '5rem' : '18rem',
      transition: 'width 0.3s ease',
      padding: '1.5rem',
      borderRight: '1px solid #374151',
      backgroundColor: '#1f2937',
      position: 'relative'
    },
    sidebarSection: {
      marginBottom: '2rem'
    },
    sectionTitle: {
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#9ca3af',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.75rem',
      display: isSidebarCollapsed ? 'none' : 'block'
    },
    navList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    navItem: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '0.875rem',
      transition: 'all 0.2s ease',
      position: 'relative'
    },
    navItemActive: {
      backgroundColor: '#374151',
      color: 'white'
    },
    navItemInactive: {
      backgroundColor: 'transparent',
      color: '#9ca3af'
    },
    navItemIcon: {
      fontSize: '1.25rem',
      width: '1.25rem',
      height: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    navItemLabel: {
      display: isSidebarCollapsed ? 'none' : 'block'
    },
    quickActions: {
      display: isSidebarCollapsed ? 'none' : 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    quickActionButton: {
      width: '100%',
      padding: '1rem',
      backgroundColor: '#374151',
      borderRadius: '0.5rem',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    quickActionIcon: {
      width: '2rem',
      height: '2rem',
      borderRadius: '0.375rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1rem'
    },
    quickActionContent: {
      flex: 1
    },
    quickActionTitle: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'white',
      marginBottom: '0.25rem'
    },
    quickActionSubtitle: {
      fontSize: '0.75rem',
      color: '#9ca3af'
    },
    esgWidget: {
      backgroundColor: '#374151',
      padding: '1rem',
      borderRadius: '0.5rem',
      textAlign: 'center',
      display: isSidebarCollapsed ? 'none' : 'block'
    },
    esgTitle: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#9ca3af',
      marginBottom: '1rem'
    },
    esgScore: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#10b981',
      marginBottom: '0.5rem'
    },
    esgChange: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      marginBottom: '1rem'
    },
    esgButton: {
      width: '100%',
      padding: '0.5rem 1rem',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer'
    },
    collapseButton: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#374151',
      borderRadius: '0.5rem',
      border: 'none',
      color: '#9ca3af',
      cursor: 'pointer',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: '1rem'
    },
    mainContent: {
      flex: 1,
      position: 'relative'
    },
    overlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 30,
      display: 'none'
    },
    content: {
      padding: '1.5rem'
    }
  }

  // Add responsive styles
  const responsiveStyles = {
    '@media (min-width: 768px)': {
      searchContainer: {
        display: 'block'
      },
      userInfo: {
        display: 'block'
      },
      menuButton: {
        display: 'none'
      }
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <nav style={styles.nav}>
          <div style={styles.logoSection}>
            <button
              style={{...styles.menuButton, display: window.innerWidth < 768 ? 'block' : 'none'}}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              ☰
            </button>
            <div style={styles.logo}>
              <div style={styles.logoIcon}>
                🧭
              </div>
              <div>
                <div style={styles.logoText}>ESG Compass</div>
                <div style={styles.logoSubtext}>Dashboard</div>
              </div>
            </div>
          </div>
          
          <div style={styles.headerRight}>
            {/* Search */}
            <div style={{...styles.searchContainer, display: window.innerWidth >= 768 ? 'block' : 'none'}}>
              <input
                type="text"
                placeholder="Quick search..."
                style={styles.searchInput}
              />
              <span style={styles.searchIcon}>🔍</span>
            </div>
            
            {/* Notifications */}
            <button style={styles.notificationButton}>
              🔔
              <span style={styles.notificationDot}>
                <span style={styles.notificationDotInner}></span>
              </span>
            </button>
            
            {/* User Menu */}
            <div style={styles.userSection}>
              <div style={{...styles.userInfo, display: window.innerWidth >= 768 ? 'block' : 'none'}}>
                <div style={styles.userName}>{user?.full_name}</div>
                <div style={styles.userRole}>Admin</div>
              </div>
              <div style={styles.userAvatar}>
                {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
              <div style={styles.userActions}>
                <button style={styles.userActionButton}>
                  ⚙️
                </button>
                <button style={styles.logoutButton} onClick={handleLogout}>
                  🚪
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <div style={styles.mainLayout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarSection}>
            <div style={styles.sectionTitle}>Navigation</div>
            <div style={styles.navList}>
              {navigationItems.map((item) => {
                const isActive = isActivePath(item.path)
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    style={{
                      ...styles.navItem,
                      ...(isActive ? styles.navItemActive : styles.navItemInactive)
                    }}
                  >
                    <span style={{...styles.navItemIcon, color: isActive ? item.color : '#9ca3af'}}>
                      {item.icon}
                    </span>
                    <span style={styles.navItemLabel}>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div style={styles.sidebarSection}>
            <div style={styles.sectionTitle}>Quick Actions</div>
            <div style={styles.quickActions}>
              <button style={styles.quickActionButton}>
                <div style={{...styles.quickActionIcon, backgroundColor: 'rgba(16, 185, 129, 0.2)'}}>
                  <span style={{color: '#10b981'}}>📊</span>
                </div>
                <div style={styles.quickActionContent}>
                  <div style={styles.quickActionTitle}>New Report</div>
                  <div style={styles.quickActionSubtitle}>Generate ESG report</div>
                </div>
              </button>
              
              <button style={styles.quickActionButton}>
                <div style={{...styles.quickActionIcon, backgroundColor: 'rgba(59, 130, 246, 0.2)'}}>
                  <span style={{color: '#3b82f6'}}>📤</span>
                </div>
                <div style={styles.quickActionContent}>
                  <div style={styles.quickActionTitle}>Upload Data</div>
                  <div style={styles.quickActionSubtitle}>Import CSV/Excel</div>
                </div>
              </button>
            </div>
          </div>
          
          {/* ESG Score Widget */}
          <div style={styles.sidebarSection}>
            <div style={styles.esgWidget}>
              <div style={styles.esgTitle}>Current ESG Score</div>
              <div style={styles.esgScore}>75</div>
              <div style={styles.esgChange}>+5 this month</div>
              <button style={styles.esgButton}>
                View Details
              </button>
            </div>
          </div>
          
          {/* Collapse Toggle */}
          <button
            style={styles.collapseButton}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? '→' : '←'}
          </button>
        </aside>

        {/* Main Content Area */}
        <main style={styles.mainContent}>
          {/* Mobile Sidebar Overlay */}
          {!isSidebarCollapsed && window.innerWidth < 768 && (
            <div 
              style={styles.overlay}
              onClick={() => setIsSidebarCollapsed(true)}
            ></div>
          )}
          
          {/* Content */}
          <div style={styles.content}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout