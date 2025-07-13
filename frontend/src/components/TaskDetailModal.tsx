import { useState } from 'react'
import { useTaskEvidence, useUploadEvidence, useDeleteEvidence, useDownloadEvidence } from '../hooks/useTasks'

interface Evidence {
  id: string
  original_filename: string
  file_size: number
  uploaded_at: string
  uploaded_by: string
  mime_type: string
}

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
  evidence: Evidence[]
}

interface TaskDetailModalProps {
  task: TaskDetail | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: (taskId: string, newStatus: TaskDetail['status']) => void
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  onStatusChange 
}) => {
  const [dragActive, setDragActive] = useState(false)
  
  // API hooks
  const { data: evidence = [], isLoading: evidenceLoading } = useTaskEvidence(task?.id || '')
  const uploadMutation = useUploadEvidence()
  const deleteMutation = useDeleteEvidence()
  const downloadMutation = useDownloadEvidence()

  if (!isOpen || !task) return null

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      await handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      await uploadMutation.mutateAsync({ taskId: task.id, file })
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleDownload = async (evidenceId: string) => {
    try {
      await downloadMutation.mutateAsync(evidenceId)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleDelete = async (evidenceId: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteMutation.mutateAsync(evidenceId)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryIcon = (category: TaskDetail['category']) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-card rounded-card w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-green/20 rounded-lg flex items-center justify-center">
              <i className={getCategoryIcon(task.category)}></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-high">{task.title}</h2>
              <p className="text-text-muted text-sm capitalize">{task.category} • Due: {formatDate(task.due_date)}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-text-muted hover:text-text-high transition-colors"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            {/* Task Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-high mb-2">Description</h3>
                  <p className="text-text-muted text-sm">{task.description}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-text-high mb-2">Compliance Context</h3>
                  <p className="text-text-muted text-sm">{task.compliance_context}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-high mb-2">Action Required</h3>
                  <p className="text-text-muted text-sm">{task.action_required}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-text-high mb-2">Framework Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {task.framework_tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-brand-green/20 text-brand-green rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-text-high mb-2">Status</h3>
                  <select 
                    value={task.status}
                    onChange={(e) => onStatusChange(task.id, e.target.value as TaskDetail['status'])}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-text-high focus:outline-none focus:border-brand-green"
                  >
                    <option value="todo" className="bg-gray-800">To Do</option>
                    <option value="in_progress" className="bg-gray-800">In Progress</option>
                    <option value="completed" className="bg-gray-800">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-text-high mb-4">Evidence Upload</h3>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-brand-green bg-brand-green/10' 
                    : 'border-white/20 hover:border-white/40'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-brand-blue/20 rounded-full flex items-center justify-center mx-auto">
                    <i className="fa-solid fa-cloud-upload-alt text-brand-blue text-2xl"></i>
                  </div>
                  <div>
                    <p className="text-text-high font-medium mb-1">
                      {uploadMutation.isPending ? 'Uploading...' : 'Drop files here or click to upload'}
                    </p>
                    <p className="text-text-muted text-sm">
                      Supports PDF, JPG, PNG, DOCX up to 50MB
                    </p>
                  </div>
                  <label className="inline-block">
                    <input 
                      type="file" 
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      disabled={uploadMutation.isPending}
                    />
                    <span className="px-6 py-2 bg-brand-blue text-white rounded-lg font-medium hover:bg-opacity-90 transition-all cursor-pointer">
                      {uploadMutation.isPending ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-plus mr-2"></i>
                          Choose Files
                        </>
                      )}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Uploaded Evidence */}
            {evidence.length > 0 && (
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg font-semibold text-text-high mb-4">
                  Uploaded Evidence ({evidence.length})
                </h3>
                
                {evidenceLoading ? (
                  <div className="text-center py-4">
                    <i className="fa-solid fa-spinner fa-spin text-text-muted"></i>
                    <p className="text-text-muted text-sm mt-2">Loading evidence...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {evidence.map((evidenceItem: Evidence) => (
                      <div key={evidenceItem.id} className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                        <div className="w-10 h-10 bg-brand-green/20 rounded-lg flex items-center justify-center">
                          <i className="fa-solid fa-file text-brand-green"></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-text-high font-medium">{evidenceItem.original_filename}</p>
                          <p className="text-text-muted text-sm">
                            {formatFileSize(evidenceItem.file_size)} • Uploaded by {evidenceItem.uploaded_by} • {formatDate(evidenceItem.uploaded_at)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleDownload(evidenceItem.id)}
                            disabled={downloadMutation.isPending}
                            className="px-3 py-1.5 bg-brand-blue text-white rounded-lg text-sm hover:bg-opacity-90 transition-all disabled:opacity-50"
                          >
                            {downloadMutation.isPending ? (
                              <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                            ) : (
                              <i className="fa-solid fa-download mr-1"></i>
                            )}
                            Download
                          </button>
                          <button 
                            onClick={() => handleDelete(evidenceItem.id)}
                            disabled={deleteMutation.isPending}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all disabled:opacity-50"
                          >
                            {deleteMutation.isPending ? (
                              <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                            ) : (
                              <i className="fa-solid fa-trash mr-1"></i>
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetailModal