import { useState, useEffect } from 'react'
import { userStorage, type User, type ActivityLog } from '../services/userStorage'

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('users')
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [isEditingUser, setIsEditingUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Form state for adding/editing users
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'contributor' as User['role'],
    department: '',
    phone: '',
    status: 'active' as User['status']
  })

  // Load users and activities on component mount
  useEffect(() => {
    loadUsers()
    loadActivities()
    
    // Listen for user updates
    const handleUsersUpdated = () => {
      loadUsers()
      loadActivities()
    }
    
    window.addEventListener('usersUpdated', handleUsersUpdated)
    
    return () => {
      window.removeEventListener('usersUpdated', handleUsersUpdated)
    }
  }, [])

  const loadUsers = () => {
    const storedUsers = userStorage.getUsers()
    setUsers(storedUsers)
  }

  const loadActivities = () => {
    const storedActivities = userStorage.getActivityLogs()
    setActivities(storedActivities)
  }

  // Handle adding new user
  const handleAddUser = () => {
    if (!formData.name || !formData.email) {
      alert('Please fill in all required fields')
      return
    }

    // Check if email already exists
    if (userStorage.getUserByEmail(formData.email)) {
      alert('User with this email already exists')
      return
    }

    try {
      const newUser = userStorage.addUser(formData)
      console.log('User added:', newUser)
      
      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        role: 'contributor',
        department: '',
        phone: '',
        status: 'active'
      })
      setIsAddingUser(false)
      
      // Refresh data
      loadUsers()
      loadActivities()
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('usersUpdated'))
      
    } catch (error) {
      console.error('Error adding user:', error)
      alert('Error adding user. Please try again.')
    }
  }

  // Handle editing user
  const handleEditUser = (user: User) => {
    setIsEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      phone: user.phone || '',
      status: user.status
    })
  }

  // Handle updating user
  const handleUpdateUser = () => {
    if (!isEditingUser) return

    try {
      userStorage.updateUser(isEditingUser.id, formData)
      
      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        role: 'contributor',
        department: '',
        phone: '',
        status: 'active'
      })
      setIsEditingUser(null)
      
      // Refresh data
      loadUsers()
      loadActivities()
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('usersUpdated'))
      
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user. Please try again.')
    }
  }

  // Handle deleting user
  const handleDeleteUser = (user: User) => {
    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
      alert('Cannot delete the last admin user')
      return
    }

    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        userStorage.deleteUser(user.id)
        
        // Refresh data
        loadUsers()
        loadActivities()
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('usersUpdated'))
        
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Error deleting user. Please try again.')
      }
    }
  }

  // Handle status toggle
  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    
    try {
      userStorage.updateUserStatus(user.id, newStatus)
      
      // Refresh data
      loadUsers()
      loadActivities()
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('usersUpdated'))
      
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Error updating user status. Please try again.')
    }
  }

  // Get filtered users
  const getFilteredUsers = () => {
    return userStorage.searchUsers(searchQuery, roleFilter === 'all' ? '' : roleFilter, statusFilter === 'all' ? '' : statusFilter)
  }

  // Get user statistics
  const getUserStats = () => {
    const stats = userStorage.getUserStats()
    return {
      total: stats.total_users,
      active: stats.active_users,
      inactive: stats.inactive_users,
      admins: stats.admins,
      managers: stats.managers,
      contributors: stats.contributors,
      viewers: stats.viewers,
      recentLogins: stats.recent_logins
    }
  }

  // Format time ago
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 30) return `${diffDays} days ago`
    return date.toLocaleDateString()
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
    tabsContainer: {
      display: 'flex',
      gap: '0.25rem',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '0.5rem',
      padding: '0.25rem',
      marginBottom: '2rem'
    },
    tab: {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.375rem',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    },
    tabActive: {
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      color: 'white',
      border: '1px solid rgba(16, 185, 129, 0.5)'
    },
    tabInactive: {
      backgroundColor: 'transparent',
      color: '#9ca3af'
    },
    searchSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem'
    },
    searchGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    searchInput: {
      width: '16rem',
      padding: '0.5rem 1rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '0.875rem',
      outline: 'none'
    },
    select: {
      padding: '0.5rem 1rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '0.875rem',
      outline: 'none',
      boxSizing: 'border-box'
    },
    addButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    card: {
      backgroundColor: '#1f2937',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151'
    },
    userItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '0.5rem',
      marginBottom: '1rem'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    avatar: {
      width: '2.5rem',
      height: '2.5rem',
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#10b981'
    },
    userDetails: {
      flex: 1
    },
    userName: {
      fontSize: '1rem',
      fontWeight: '500',
      color: 'white',
      marginBottom: '0.25rem'
    },
    userEmail: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    userMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem'
    },
    metaGroup: {
      textAlign: 'center'
    },
    metaLabel: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      marginBottom: '0.25rem'
    },
    metaValue: {
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    actionButtons: {
      display: 'flex',
      gap: '0.5rem'
    },
    actionButton: {
      padding: '0.5rem',
      backgroundColor: '#374151',
      border: 'none',
      borderRadius: '0.375rem',
      color: '#9ca3af',
      cursor: 'pointer',
      fontSize: '0.875rem'
    },
    roleCard: {
      backgroundColor: '#1f2937',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      marginBottom: '1rem'
    },
    roleHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1rem'
    },
    roleTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'white',
      marginBottom: '0.25rem'
    },
    roleDescription: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    permissionsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    permissionItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '0.75rem'
    },
    permissionLabel: {
      color: '#9ca3af'
    },
    permissionStatus: {
      fontWeight: '500'
    },
    activityItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '0.75rem',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '0.5rem',
      marginBottom: '1rem'
    },
    activityIcon: {
      width: '2rem',
      height: '2rem',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.875rem'
    },
    activityContent: {
      flex: 1
    },
    activityTitle: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'white',
      marginBottom: '0.25rem'
    },
    activityDescription: {
      fontSize: '0.75rem',
      color: '#9ca3af'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: '#1f2937',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      maxWidth: '28rem',
      width: '90%'
    },
    modalTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'white',
      marginBottom: '1rem'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '0.875rem',
      outline: 'none',
      marginBottom: '1rem',
      boxSizing: 'border-box'
    },
    modalButtons: {
      display: 'flex',
      gap: '0.75rem',
      marginTop: '1rem'
    },
    cancelButton: {
      flex: 1,
      padding: '0.5rem 1rem',
      border: '1px solid #374151',
      backgroundColor: 'transparent',
      color: '#9ca3af',
      borderRadius: '0.5rem',
      cursor: 'pointer'
    },
    submitButton: {
      flex: 1,
      padding: '0.5rem 1rem',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer'
    }
  }

  // Get filtered users for display
  const filteredUsers = getFilteredUsers()
  const userStats = getUserStats()

  const roles = [
    { id: 'admin', name: 'Admin', description: 'Full platform access and user management' },
    { id: 'manager', name: 'Manager', description: 'Department oversight and report generation' },
    { id: 'contributor', name: 'Contributor', description: 'Data entry and evidence upload' },
    { id: 'viewer', name: 'Viewer', description: 'Read-only dashboard access' }
  ]

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>👥 User Management</h1>
        <p style={styles.subtitle}>Manage team members and access permissions</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button 
          onClick={() => setActiveTab('users')}
          style={{
            ...styles.tab,
            ...(activeTab === 'users' ? styles.tabActive : styles.tabInactive)
          }}
        >
          👤 Users
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          style={{
            ...styles.tab,
            ...(activeTab === 'roles' ? styles.tabActive : styles.tabInactive)
          }}
        >
          🔐 Roles & Permissions
        </button>
        <button 
          onClick={() => setActiveTab('activity')}
          style={{
            ...styles.tab,
            ...(activeTab === 'activity' ? styles.tabActive : styles.tabInactive)
          }}
        >
          📋 Activity Log
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          {/* User Statistics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              ...styles.card,
              textAlign: 'center',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {getUserStats().total}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Total Users</div>
            </div>
            <div style={{
              ...styles.card,
              textAlign: 'center',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {getUserStats().active}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Active</div>
            </div>
            <div style={{
              ...styles.card,
              textAlign: 'center',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {getUserStats().inactive}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Inactive</div>
            </div>
            <div style={{
              ...styles.card,
              textAlign: 'center',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {getUserStats().recentLogins}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Recent Logins</div>
            </div>
          </div>
          <div style={styles.searchSection}>
            <div style={styles.searchGroup}>
              <input
                type="text"
                placeholder="🔍 Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Roles</option>
                <option value="admin">👑 Admin</option>
                <option value="manager">👔 Manager</option>
                <option value="contributor">✏️ Contributor</option>
                <option value="viewer">👁️ Viewer</option>
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Status</option>
                <option value="active">✅ Active</option>
                <option value="inactive">❌ Inactive</option>
              </select>
            </div>
            <button
              onClick={() => setIsAddingUser(true)}
              style={styles.addButton}
            >
              <span>➕</span>
              <span>Add User</span>
            </button>
          </div>

          <div style={styles.card}>
            <div>
              {filteredUsers.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#9ca3af'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No users found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} style={styles.userItem}>
                    <div style={styles.userInfo}>
                      <div style={styles.avatar}>
                        <span>{user.avatar}</span>
                      </div>
                      <div style={styles.userDetails}>
                        <div style={styles.userName}>{user.name}</div>
                        <div style={styles.userEmail}>{user.email}</div>
                        {user.department && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {user.department}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={styles.userMeta}>
                      <div style={styles.metaGroup}>
                        <div style={styles.metaLabel}>Role</div>
                        <div style={{...styles.metaValue, color: 'white'}}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </div>
                      </div>
                      <div style={styles.metaGroup}>
                        <div style={styles.metaLabel}>Status</div>
                        <div style={{
                          ...styles.metaValue, 
                          color: user.status === 'active' ? '#10b981' : '#ef4444'
                        }}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </div>
                      </div>
                      <div style={styles.metaGroup}>
                        <div style={styles.metaLabel}>Last Login</div>
                        <div style={{...styles.metaValue, color: 'white'}}>
                          {formatTimeAgo(user.last_login)}
                        </div>
                      </div>
                      <div style={styles.actionButtons}>
                        <button 
                          style={styles.actionButton}
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          ✏️
                        </button>
                        <button 
                          style={{...styles.actionButton, color: user.status === 'active' ? '#f59e0b' : '#10b981'}}
                          onClick={() => handleToggleStatus(user)}
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {user.status === 'active' ? '⏸️' : '▶️'}
                        </button>
                        <button 
                          style={{...styles.actionButton, color: '#ef4444'}}
                          onClick={() => handleDeleteUser(user)}
                          title="Delete User"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
          {roles.map((role) => (
            <div key={role.id} style={styles.roleCard}>
              <div style={styles.roleHeader}>
                <div>
                  <h3 style={styles.roleTitle}>{role.name}</h3>
                  <p style={styles.roleDescription}>{role.description}</p>
                </div>
                <button style={styles.actionButton}>
                  ✏️
                </button>
              </div>
              <div>
                <div style={{fontSize: '0.875rem', color: 'white', fontWeight: '500', marginBottom: '0.5rem'}}>
                  🔐 Permissions:
                </div>
                <div style={styles.permissionsList}>
                  <div style={styles.permissionItem}>
                    <span style={styles.permissionLabel}>📊 Dashboard Access</span>
                    <span style={{...styles.permissionStatus, color: '#10b981'}}>✅</span>
                  </div>
                  <div style={styles.permissionItem}>
                    <span style={styles.permissionLabel}>✏️ Data Entry</span>
                    <span style={{
                      ...styles.permissionStatus, 
                      color: role.id === 'viewer' ? '#ef4444' : '#10b981'
                    }}>
                      {role.id === 'viewer' ? '❌' : '✅'}
                    </span>
                  </div>
                  <div style={styles.permissionItem}>
                    <span style={styles.permissionLabel}>📄 Report Generation</span>
                    <span style={{
                      ...styles.permissionStatus, 
                      color: ['admin', 'manager'].includes(role.id) ? '#10b981' : '#ef4444'
                    }}>
                      {['admin', 'manager'].includes(role.id) ? '✅' : '❌'}
                    </span>
                  </div>
                  <div style={styles.permissionItem}>
                    <span style={styles.permissionLabel}>👥 User Management</span>
                    <span style={{
                      ...styles.permissionStatus, 
                      color: role.id === 'admin' ? '#10b981' : '#ef4444'
                    }}>
                      {role.id === 'admin' ? '✅' : '❌'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === 'activity' && (
        <div style={styles.card}>
          <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'white', marginBottom: '1rem'}}>
            📋 Recent Activity
          </h3>
          <div>
            {activities.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#9ca3af'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
                <p>No activity logs available</p>
              </div>
            ) : (
              activities.slice(0, 10).map((activity) => (
                <div key={activity.id} style={styles.activityItem}>
                  <div style={{
                    ...styles.activityIcon,
                    backgroundColor: activity.type === 'user_added' ? 'rgba(16, 185, 129, 0.2)' :
                                   activity.type === 'user_updated' ? 'rgba(59, 130, 246, 0.2)' :
                                   activity.type === 'user_login' ? 'rgba(168, 85, 247, 0.2)' :
                                   'rgba(107, 114, 128, 0.2)'
                  }}>
                    <span style={{
                      color: activity.type === 'user_added' ? '#10b981' :
                            activity.type === 'user_updated' ? '#3b82f6' :
                            activity.type === 'user_login' ? '#a855f7' :
                            '#6b7280'
                    }}>
                      {activity.type === 'user_added' ? '➕' :
                       activity.type === 'user_updated' ? '✏️' :
                       activity.type === 'user_login' ? '🔐' :
                       activity.type === 'user_deleted' ? '🗑️' :
                       activity.type === 'role_changed' ? '👤' :
                       '📝'}
                    </span>
                  </div>
                  <div style={styles.activityContent}>
                    <div style={styles.activityTitle}>
                      {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div style={styles.activityDescription}>
                      {activity.description} • {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddingUser && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>➕ Add New User</h3>
            <div>
              <input 
                style={styles.input} 
                placeholder="👤 Full Name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <input 
                style={styles.input} 
                placeholder="📧 Email Address" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <input 
                style={styles.input} 
                placeholder="🏢 Department (optional)" 
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
              <input 
                style={styles.input} 
                placeholder="📱 Phone (optional)" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <select 
                style={styles.input}
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as User['role']})}
              >
                <option value="contributor">✏️ Contributor</option>
                <option value="manager">👔 Manager</option>
                <option value="viewer">👁️ Viewer</option>
                <option value="admin">👑 Admin</option>
              </select>
              <select 
                style={styles.input}
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as User['status']})}
              >
                <option value="active">✅ Active</option>
                <option value="inactive">❌ Inactive</option>
              </select>
              <div style={styles.modalButtons}>
                <button
                  onClick={() => {
                    setIsAddingUser(false)
                    setFormData({
                      name: '',
                      email: '',
                      role: 'contributor',
                      department: '',
                      phone: '',
                      status: 'active'
                    })
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  style={styles.submitButton}
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditingUser && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>✏️ Edit User</h3>
            <div>
              <input 
                style={styles.input} 
                placeholder="🧑 Full Name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <input 
                style={styles.input} 
                placeholder="📧 Email Address" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <input 
                style={styles.input} 
                placeholder="🏢 Department (optional)" 
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
              <input 
                style={styles.input} 
                placeholder="📱 Phone (optional)" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <select 
                style={styles.input}
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as User['role']})}
              >
                <option value="contributor">✏️ Contributor</option>
                <option value="manager">👔 Manager</option>
                <option value="viewer">👁️ Viewer</option>
                <option value="admin">👑 Admin</option>
              </select>
              <select 
                style={styles.input}
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as User['status']})}
              >
                <option value="active">✅ Active</option>
                <option value="inactive">❌ Inactive</option>
              </select>
              <div style={styles.modalButtons}>
                <button
                  onClick={() => {
                    setIsEditingUser(null)
                    setFormData({
                      name: '',
                      email: '',
                      role: 'contributor',
                      department: '',
                      phone: '',
                      status: 'active'
                    })
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  style={styles.submitButton}
                >
                  Update User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement