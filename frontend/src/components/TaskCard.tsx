import { useState } from 'react'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'completed'
  category: 'environmental' | 'social' | 'governance'
  due_date: string
  assigned_user?: string
  evidence_count: number
  required_evidence: number
}

interface TaskCardProps {
  task: Task
  onStatusChange: (taskId: string, newStatus: Task['status']) => void
  onViewDetails: (taskId: string) => void
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onViewDetails }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-brand-green/20 text-brand-green'
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'todo':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-white/20 text-text-muted'
    }
  }

  const getCategoryIcon = (category: Task['category']) => {
    switch (category) {
      case 'environmental':
        return 'fa-solid fa-leaf text-brand-green'
      case 'social':
        return 'fa-solid fa-users text-brand-blue'
      case 'governance':
        return 'fa-solid fa-shield-halved text-brand-teal'
      default:
        return 'fa-solid fa-circle text-text-muted'
    }
  }

  const getCategoryColor = (category: Task['category']) => {
    switch (category) {
      case 'environmental':
        return 'bg-brand-green/20'
      case 'social':
        return 'bg-brand-blue/20'
      case 'governance':
        return 'bg-brand-teal/20'
      default:
        return 'bg-white/20'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const evidenceProgress = (task.evidence_count / task.required_evidence) * 100

  return (
    <div className="glass-card rounded-card p-6 hover:transform hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 ${getCategoryColor(task.category)} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <i className={getCategoryIcon(task.category)}></i>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-text-high leading-tight">{task.title}</h3>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-text-muted hover:text-text-high transition-colors ml-2"
            >
              <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
            </button>
          </div>
          
          <p className="text-text-muted text-sm mb-4 line-clamp-2">{task.description}</p>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>
            <span className="text-text-muted text-sm">
              <i className="fa-solid fa-calendar mr-1"></i>
              Due: {formatDate(task.due_date)}
            </span>
            <span className="text-text-muted text-sm capitalize">
              <i className="fa-solid fa-tag mr-1"></i>
              {task.category}
            </span>
          </div>

          {/* Evidence Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Evidence Progress</span>
              <span className="text-sm text-text-high font-medium">
                {task.evidence_count} / {task.required_evidence} files
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-brand-green h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(evidenceProgress, 100)}%` }}
              ></div>
            </div>
          </div>

          {isExpanded && (
            <div className="pt-4 border-t border-white/10 space-y-4 animate-fade-in">
              <div>
                <h4 className="text-sm font-medium text-text-high mb-2">Actions Required:</h4>
                <ul className="text-sm text-text-muted space-y-1">
                  <li>• Upload monthly utility bills</li>
                  <li>• Provide energy usage data</li>
                  <li>• Document energy efficiency measures</li>
                </ul>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select 
                  value={task.status}
                  onChange={(e) => onStatusChange(task.id, e.target.value as Task['status'])}
                  className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-text-high text-sm focus:outline-none focus:border-brand-green"
                >
                  <option value="todo" className="bg-gray-800">To Do</option>
                  <option value="in_progress" className="bg-gray-800">In Progress</option>
                  <option value="completed" className="bg-gray-800">Completed</option>
                </select>
                
                <button 
                  onClick={() => onViewDetails(task.id)}
                  className="px-4 py-1.5 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all"
                >
                  View Details
                </button>
                
                <button className="px-4 py-1.5 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all">
                  <i className="fa-solid fa-upload mr-1"></i>
                  Upload Evidence
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskCard