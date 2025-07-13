import React, { useState, useEffect } from 'react'
import { taskStorage, type Task } from '../services/taskStorage'
import { userStorage, type User } from '../services/userStorage'

// Remove the local Task interface as we're importing it from taskStorage

interface TaskDetail {
  id: string
  title: string
  description: string
  compliance_context: string
  action_required: string
  status: 'todo' | 'in_progress' | 'completed'
  category: 'environmental' | 'social' | 'governance'
  due_date: string
  framework_tags: string[]
  evidence: any[]
}

const TaskManagement = () => {
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [taskToAssign, setTaskToAssign] = useState<Task | null>(null)
  const [taskToUpload, setTaskToUpload] = useState<Task | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadDescription, setUploadDescription] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterAssignment, setFilterAssignment] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])

  // Load tasks from storage
  const [tasks, setTasks] = useState<Task[]>([])
  
  // Load tasks and users on component mount
  useEffect(() => {
    const loadTasks = () => {
      const storedTasks = taskStorage.getTasks()
      setTasks(storedTasks)
    }
    
    const loadUsers = () => {
      const storedUsers = userStorage.getUsers()
      setUsers(storedUsers)
    }
    
    loadTasks()
    loadUsers()
    
    // Listen for storage changes (if tasks are added from other components)
    const handleStorageChange = () => {
      loadTasks()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Custom event for when tasks are added programmatically
    window.addEventListener('tasksUpdated', handleStorageChange)
    
    // Listen for user updates
    const handleUsersUpdated = () => {
      loadUsers()
    }
    window.addEventListener('usersUpdated', handleUsersUpdated)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('tasksUpdated', handleStorageChange)
      window.removeEventListener('usersUpdated', handleUsersUpdated)
    }
  }, [])

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    // Update in storage
    taskStorage.updateTaskStatus(taskId, newStatus)
    
    // Update local state
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ))
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('tasksUpdated'))
  }

  const handleViewDetails = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      const detailedTask: TaskDetail = {
        id: task.id,
        title: task.title,
        description: task.description,
        compliance_context: task.compliance_context || 'This task supports compliance with UAE ESG reporting requirements.',
        action_required: task.action_required || 'Complete the required actions and upload supporting documentation.',
        status: task.status,
        category: task.category,
        due_date: task.due_date,
        framework_tags: task.framework_tags || task.frameworks || [],
        evidence: [] // In real app, would load from evidence storage
      }
      setSelectedTask(detailedTask)
      setIsModalOpen(true)
    }
  }

  const handleAssignUser = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setTaskToAssign(task)
      setIsAssignModalOpen(true)
    }
  }

  const assignUserToTask = (userId: string, userName: string) => {
    if (taskToAssign) {
      taskStorage.assignUserToTask(taskToAssign.id, userId, userName)
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskToAssign.id ? { ...task, assigned_user: userName, assigned_user_id: userId } : task
      ))
      
      // Close modal
      setIsAssignModalOpen(false)
      setTaskToAssign(null)
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('tasksUpdated'))
    }
  }

  const unassignUserFromTask = (taskId: string) => {
    taskStorage.unassignUserFromTask(taskId)
    
    // Update local state
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, assigned_user: 'Unassigned', assigned_user_id: undefined } : task
    ))
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('tasksUpdated'))
  }

  const handleUploadEvidence = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setTaskToUpload(task)
      setIsUploadModalOpen(true)
      setSelectedFiles([])
      setUploadDescription('')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setSelectedFiles(Array.from(files))
    }
  }

  const uploadFiles = () => {
    if (taskToUpload && selectedFiles.length > 0) {
      // In a real app, this would upload to a server
      // For now, we'll simulate by updating the task's evidence count
      const newEvidenceCount = taskToUpload.evidence_count + selectedFiles.length
      
      taskStorage.updateTask(taskToUpload.id, { 
        evidence_count: newEvidenceCount 
      })
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskToUpload.id ? { ...task, evidence_count: newEvidenceCount } : task
      ))
      
      // Close modal and reset state
      setIsUploadModalOpen(false)
      setTaskToUpload(null)
      setSelectedFiles([])
      setUploadDescription('')
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('tasksUpdated'))
      
      // Show success message
      alert(`Successfully uploaded ${selectedFiles.length} evidence file(s)!`)
    }
  }

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf': return '📄'
      case 'doc': case 'docx': return '📝'
      case 'xls': case 'xlsx': return '📊'
      case 'ppt': case 'pptx': return '📽️'
      case 'jpg': case 'jpeg': case 'png': case 'gif': return '🖼️'
      case 'zip': case 'rar': return '📦'
      default: return '📎'
    }
  }

  // Filter tasks based on status, category, assignment, and search term
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory
    const matchesAssignment = filterAssignment === 'all' || 
      (filterAssignment === 'assigned' && task.assigned_user && task.assigned_user !== 'Unassigned') ||
      (filterAssignment === 'unassigned' && (!task.assigned_user || task.assigned_user === 'Unassigned'))
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesCategory && matchesAssignment && matchesSearch
  })

  const getTaskCounts = () => {
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'completed').length,
      assigned: tasks.filter(t => t.assigned_user && t.assigned_user !== 'Unassigned').length,
      unassigned: tasks.filter(t => !t.assigned_user || t.assigned_user === 'Unassigned').length
    }
  }

  const taskCounts = getTaskCounts()

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'environmental': return '🌱'
      case 'social': return '👥'
      case 'governance': return '⚖️'
      default: return '📋'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental': return '#10b981'
      case 'social': return '#3b82f6'
      case 'governance': return '#a855f7'
      default: return '#6b7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981'
      case 'in_progress': return '#f59e0b'
      case 'todo': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed'
      case 'in_progress': return 'In Progress'
      case 'todo': return 'To Do'
      default: return 'Unknown'
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
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
    filterCard: {
      backgroundColor: '#1f2937',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      marginBottom: '2rem'
    },
    filterGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      alignItems: 'center'
    },
    filterButtons: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap'
    },
    filterButton: {
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    },
    filterButtonActive: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    filterButtonInactive: {
      backgroundColor: '#374151',
      color: '#9ca3af'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '0.875rem',
      outline: 'none'
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '0.875rem',
      outline: 'none'
    },
    addButton: {
      padding: '0.75rem 1.5rem',
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
    taskCard: {
      backgroundColor: '#1f2937',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      marginBottom: '1rem',
      transition: 'all 0.2s ease'
    },
    taskHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1rem'
    },
    taskTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'white',
      marginBottom: '0.5rem'
    },
    taskDescription: {
      fontSize: '0.875rem',
      color: '#9ca3af',
      lineHeight: '1.5'
    },
    taskMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginTop: '1rem'
    },
    categoryBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.375rem',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    statusBadge: {
      padding: '0.25rem 0.5rem',
      borderRadius: '0.375rem',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    progressBar: {
      width: '100%',
      height: '0.5rem',
      backgroundColor: '#374151',
      borderRadius: '0.25rem',
      overflow: 'hidden',
      marginTop: '1rem'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#10b981',
      borderRadius: '0.25rem',
      transition: 'width 0.3s ease'
    },
    taskActions: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '1rem'
    },
    actionButton: {
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    },
    primaryAction: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    secondaryAction: {
      backgroundColor: '#374151',
      color: '#9ca3af'
    },
    emptyState: {
      backgroundColor: '#1f2937',
      padding: '3rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      textAlign: 'center'
    },
    emptyIcon: {
      fontSize: '3rem',
      marginBottom: '1rem'
    },
    emptyTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'white',
      marginBottom: '0.5rem'
    },
    emptyDescription: {
      fontSize: '0.875rem',
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
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem'
    },
    modalTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: 'white'
    },
    closeButton: {
      padding: '0.5rem',
      backgroundColor: '#374151',
      border: 'none',
      borderRadius: '0.5rem',
      color: '#9ca3af',
      cursor: 'pointer',
      fontSize: '1rem'
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>✅ Task Management</h1>
        <p style={styles.subtitle}>Manage your ESG tasks and evidence uploads</p>
      </div>

      {/* Task Statistics */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: '#10b981'}}>{taskCounts.total}</div>
          <div style={styles.statLabel}>Total Tasks</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: '#ef4444'}}>{taskCounts.todo}</div>
          <div style={styles.statLabel}>To Do</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: '#f59e0b'}}>{taskCounts.in_progress}</div>
          <div style={styles.statLabel}>In Progress</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: '#10b981'}}>{taskCounts.completed}</div>
          <div style={styles.statLabel}>Completed</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: '#ef4444'}}>{taskCounts.overdue}</div>
          <div style={styles.statLabel}>Overdue</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: '#3b82f6'}}>{taskCounts.assigned}</div>
          <div style={styles.statLabel}>Assigned</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statValue, color: '#9ca3af'}}>{taskCounts.unassigned}</div>
          <div style={styles.statLabel}>Unassigned</div>
        </div>
      </div>

      {/* Task Filters and Search */}
      <div style={styles.filterCard}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <div style={styles.filterButtons}>
            <button 
              onClick={() => setFilterStatus('all')}
              style={{
                ...styles.filterButton,
                ...(filterStatus === 'all' ? styles.filterButtonActive : styles.filterButtonInactive)
              }}
            >
              All Tasks
            </button>
            <button 
              onClick={() => setFilterStatus('todo')}
              style={{
                ...styles.filterButton,
                ...(filterStatus === 'todo' ? styles.filterButtonActive : styles.filterButtonInactive)
              }}
            >
              To Do
            </button>
            <button 
              onClick={() => setFilterStatus('in_progress')}
              style={{
                ...styles.filterButton,
                ...(filterStatus === 'in_progress' ? styles.filterButtonActive : styles.filterButtonInactive)
              }}
            >
              In Progress
            </button>
            <button 
              onClick={() => setFilterStatus('completed')}
              style={{
                ...styles.filterButton,
                ...(filterStatus === 'completed' ? styles.filterButtonActive : styles.filterButtonInactive)
              }}
            >
              Completed
            </button>
          </div>

          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Categories</option>
            <option value="environmental">🌱 Environmental</option>
            <option value="social">👥 Social</option>
            <option value="governance">⚖️ Governance</option>
          </select>

          <div style={{position: 'relative'}}>
            <input
              type="text"
              placeholder="🔍 Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.input}
            />
          </div>

          <button style={styles.addButton}>
            <span>➕</span>
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div>
        {filteredTasks.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📋</div>
            <h3 style={styles.emptyTitle}>No tasks found</h3>
            <p style={styles.emptyDescription}>Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} style={styles.taskCard}>
              <div style={styles.taskHeader}>
                <div>
                  <h3 style={styles.taskTitle}>{task.title}</h3>
                  <p style={styles.taskDescription}>{task.description}</p>
                </div>
                <div style={{
                  ...styles.categoryBadge,
                  backgroundColor: `${getCategoryColor(task.category)}33`,
                  color: getCategoryColor(task.category)
                }}>
                  <span>{getCategoryIcon(task.category)}</span>
                  <span>{task.category}</span>
                </div>
              </div>

              <div style={styles.taskMeta}>
                <div style={{
                  ...styles.statusBadge,
                  backgroundColor: `${getStatusColor(task.status)}33`,
                  color: getStatusColor(task.status)
                }}>
                  {getStatusLabel(task.status)}
                </div>
                <div style={{fontSize: '0.875rem', color: '#9ca3af'}}>
                  📅 Due: {new Date(task.due_date).toLocaleDateString()}
                </div>
                <div style={{fontSize: '0.875rem', color: '#9ca3af'}}>
                  👤 {task.assigned_user || 'Unassigned'}
                </div>
                <div style={{fontSize: '0.875rem', color: '#9ca3af'}}>
                  📎 Evidence: {task.evidence_count}/{task.required_evidence}
                </div>
              </div>

              <div style={styles.progressBar}>
                <div 
                  style={{
                    ...styles.progressFill,
                    width: `${Math.min(Math.max(task.required_evidence > 0 ? (task.evidence_count / task.required_evidence) * 100 : 0, 0), 100)}%`
                  }}
                ></div>
              </div>

              <div style={styles.taskActions}>
                <button 
                  style={{...styles.actionButton, ...styles.primaryAction}}
                  onClick={() => handleViewDetails(task.id)}
                >
                  👁️ View Details
                </button>
                <button 
                  style={{...styles.actionButton, ...styles.secondaryAction}}
                  onClick={() => handleStatusChange(task.id, 
                    task.status === 'completed' ? 'todo' : 
                    task.status === 'todo' ? 'in_progress' : 'completed'
                  )}
                >
                  {task.status === 'completed' ? '🔄 Reopen' : 
                   task.status === 'todo' ? '▶️ Start' : '✅ Complete'}
                </button>
                <button 
                  style={{...styles.actionButton, ...styles.secondaryAction}}
                  onClick={() => handleAssignUser(task.id)}
                >
                  👥 Assign
                </button>
                {task.assigned_user && task.assigned_user !== 'Unassigned' && (
                  <button 
                    style={{...styles.actionButton, ...styles.secondaryAction}}
                    onClick={() => unassignUserFromTask(task.id)}
                  >
                    ❌ Unassign
                  </button>
                )}
                <button 
                  style={{
                    ...styles.actionButton,
                    backgroundColor: '#3b82f6',
                    color: 'white'
                  }}
                  onClick={() => handleUploadEvidence(task.id)}
                >
                  📎 Upload Evidence
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Detail Modal */}
      {isModalOpen && selectedTask && (
        <div style={styles.modal} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{selectedTask.title}</h2>
              <button style={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                ❌
              </button>
            </div>
            
            <div style={{marginBottom: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem'}}>
                Description
              </h3>
              <p style={{fontSize: '0.875rem', color: '#9ca3af', lineHeight: '1.5'}}>
                {selectedTask.description}
              </p>
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem'}}>
                Compliance Context
              </h3>
              <p style={{fontSize: '0.875rem', color: '#9ca3af', lineHeight: '1.5'}}>
                {selectedTask.compliance_context}
              </p>
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem'}}>
                Action Required
              </h3>
              <p style={{fontSize: '0.875rem', color: '#9ca3af', lineHeight: '1.5'}}>
                {selectedTask.action_required}
              </p>
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem'}}>
                Framework Tags
              </h3>
              <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                {selectedTask.framework_tags.map((tag, index) => (
                  <span 
                    key={index} 
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#374151',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      color: '#9ca3af'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem'}}>
                Evidence Files ({selectedTask.evidence.length})
              </h3>
              
              {/* Evidence Progress */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                <span style={{color: '#9ca3af'}}>Evidence Progress:</span>
                <span style={{color: '#10b981', fontWeight: '500'}}>
                  {tasks.find(t => t.id === selectedTask.id)?.evidence_count || 0}/{tasks.find(t => t.id === selectedTask.id)?.required_evidence || 0} files
                </span>
                <div style={{
                  flex: 1,
                  height: '0.25rem',
                  backgroundColor: '#374151',
                  borderRadius: '0.125rem',
                  overflow: 'hidden',
                  marginLeft: '0.5rem'
                }}>
                  <div style={{
                    width: `${(() => {
                      const currentTask = tasks.find(t => t.id === selectedTask.id);
                      const evidenceCount = currentTask?.evidence_count || 0;
                      const requiredEvidence = currentTask?.required_evidence || 1;
                      return Math.min(Math.max(requiredEvidence > 0 ? (evidenceCount / requiredEvidence) * 100 : 0, 0), 100);
                    })()}%`,
                    height: '100%',
                    backgroundColor: (() => {
                      const currentTask = tasks.find(t => t.id === selectedTask.id);
                      const evidenceCount = currentTask?.evidence_count || 0;
                      const requiredEvidence = currentTask?.required_evidence || 1;
                      return evidenceCount >= requiredEvidence ? '#10b981' : '#f59e0b';
                    })(),
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
              
              {selectedTask.evidence.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  backgroundColor: '#374151',
                  borderRadius: '0.5rem',
                  color: '#9ca3af'
                }}>
                  <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>📁</div>
                  <p>No evidence files uploaded yet</p>
                  <button 
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                    onClick={() => {
                      setIsModalOpen(false)
                      handleUploadEvidence(selectedTask.id)
                    }}
                  >
                    📎 Upload Evidence
                  </button>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  {selectedTask.evidence.map((file, index) => (
                    <div 
                      key={index} 
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        backgroundColor: '#374151',
                        borderRadius: '0.5rem'
                      }}
                    >
                      <div>
                        <div style={{fontSize: '0.875rem', color: 'white', fontWeight: '500'}}>
                          📄 {file.filename}
                        </div>
                        <div style={{fontSize: '0.75rem', color: '#9ca3af'}}>
                          Uploaded by {file.uploaded_by} • {new Date(file.upload_date).toLocaleDateString()}
                        </div>
                      </div>
                      <button style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}>
                        📥 Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
              <button 
                style={{...styles.actionButton, ...styles.secondaryAction}}
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#3b82f6',
                  color: 'white'
                }}
                onClick={() => {
                  setIsModalOpen(false)
                  handleUploadEvidence(selectedTask.id)
                }}
              >
                📎 Upload Evidence
              </button>
              <button 
                style={{...styles.actionButton, ...styles.primaryAction}}
                onClick={() => {
                  handleStatusChange(selectedTask.id, 
                    selectedTask.status === 'completed' ? 'todo' : 
                    selectedTask.status === 'todo' ? 'in_progress' : 'completed'
                  )
                  setIsModalOpen(false)
                }}
              >
                {selectedTask.status === 'completed' ? '🔄 Reopen' : 
                 selectedTask.status === 'todo' ? '▶️ Start' : '✅ Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Assignment Modal */}
      {isAssignModalOpen && taskToAssign && (
        <div style={styles.modal} onClick={() => setIsAssignModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>👥 Assign User to Task</h2>
              <button style={styles.closeButton} onClick={() => setIsAssignModalOpen(false)}>
                ❌
              </button>
            </div>
            
            <div style={{marginBottom: '1.5rem'}}>
              <h3 style={{fontSize: '1rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem'}}>
                Task: {taskToAssign.title}
              </h3>
              <p style={{fontSize: '0.875rem', color: '#9ca3af'}}>
                Select a user to assign this task to:
              </p>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem'}}>
              {users.filter(user => user.status === 'active').map((user) => (
                <div 
                  key={user.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: '#374151',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                  onClick={() => assignUserToTask(user.id, user.name)}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#10b981'
                    }}>
                      {user.avatar}
                    </div>
                    <div>
                      <div style={{fontSize: '0.875rem', color: 'white', fontWeight: '500'}}>
                        {user.name}
                      </div>
                      <div style={{fontSize: '0.75rem', color: '#9ca3af'}}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)} • {user.email}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: user.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' :
                                   user.role === 'manager' ? 'rgba(59, 130, 246, 0.2)' :
                                   user.role === 'contributor' ? 'rgba(16, 185, 129, 0.2)' :
                                   'rgba(168, 85, 247, 0.2)',
                    color: user.role === 'admin' ? '#ef4444' :
                          user.role === 'manager' ? '#3b82f6' :
                          user.role === 'contributor' ? '#10b981' :
                          '#a855f7',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {user.role === 'admin' ? '👑' :
                     user.role === 'manager' ? '👔' :
                     user.role === 'contributor' ? '✏️' :
                     '👁️'} {user.role}
                  </div>
                </div>
              ))}
            </div>

            <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
              <button 
                style={{...styles.actionButton, ...styles.secondaryAction}}
                onClick={() => setIsAssignModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Upload Modal */}
      {isUploadModalOpen && taskToUpload && (
        <div style={styles.modal} onClick={() => setIsUploadModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📎 Upload Evidence</h2>
              <button style={styles.closeButton} onClick={() => setIsUploadModalOpen(false)}>
                ❌
              </button>
            </div>
            
            <div style={{marginBottom: '1.5rem'}}>
              <h3 style={{fontSize: '1rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem'}}>
                Task: {taskToUpload.title}
              </h3>
              <p style={{fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1rem'}}>
                Upload evidence files to support compliance for this task.
              </p>
              
              {/* Evidence Requirements */}
              <div style={{
                backgroundColor: '#374151',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <h4 style={{fontSize: '0.875rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem'}}>
                  📋 Required Evidence:
                </h4>
                <ul style={{margin: 0, paddingLeft: '1.5rem', color: '#9ca3af', fontSize: '0.75rem'}}>
                  {taskToUpload.evidence_required?.map((req, index) => (
                    <li key={index} style={{marginBottom: '0.25rem'}}>{req}</li>
                  )) || [
                    'Supporting documentation',
                    'Compliance certificates',
                    'Implementation records'
                  ].map((req, index) => (
                    <li key={index} style={{marginBottom: '0.25rem'}}>{req}</li>
                  ))}
                </ul>
              </div>
              
              {/* Current Evidence Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                <span style={{color: '#9ca3af'}}>Current Evidence:</span>
                <span style={{color: '#10b981', fontWeight: '500'}}>
                  {taskToUpload.evidence_count}/{taskToUpload.required_evidence} files
                </span>
                <div style={{
                  flex: 1,
                  height: '0.25rem',
                  backgroundColor: '#374151',
                  borderRadius: '0.125rem',
                  overflow: 'hidden',
                  marginLeft: '0.5rem'
                }}>
                  <div style={{
                    width: `${Math.min(Math.max(taskToUpload.required_evidence > 0 ? (taskToUpload.evidence_count / taskToUpload.required_evidence) * 100 : 0, 0), 100)}%`,
                    height: '100%',
                    backgroundColor: taskToUpload.evidence_count >= taskToUpload.required_evidence ? '#10b981' : '#f59e0b',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div style={{marginBottom: '1.5rem'}}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'white',
                marginBottom: '0.5rem'
              }}>
                📁 Select Files:
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              />
              
              {selectedFiles.length > 0 && (
                <div style={{marginTop: '1rem'}}>
                  <h4 style={{fontSize: '0.875rem', fontWeight: '500', color: 'white', marginBottom: '0.5rem'}}>
                    Selected Files ({selectedFiles.length}):
                  </h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                    {selectedFiles.map((file, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: '#4b5563',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#e5e7eb'
                      }}>
                        <span>{getFileIcon(file.name)}</span>
                        <span style={{flex: 1}}>{file.name}</span>
                        <span style={{color: '#9ca3af'}}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{marginBottom: '1.5rem'}}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'white',
                marginBottom: '0.5rem'
              }}>
                📝 Description (optional):
              </label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Add a description for this evidence upload..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
              <button 
                style={{...styles.actionButton, ...styles.secondaryAction}}
                onClick={() => setIsUploadModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: selectedFiles.length > 0 ? '#10b981' : '#6b7280',
                  color: 'white',
                  cursor: selectedFiles.length > 0 ? 'pointer' : 'not-allowed'
                }}
                onClick={uploadFiles}
                disabled={selectedFiles.length === 0}
              >
                📤 Upload {selectedFiles.length > 0 ? `${selectedFiles.length} File(s)` : 'Files'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskManagement