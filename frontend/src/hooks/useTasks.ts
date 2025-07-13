import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksAPI, evidenceAPI } from '../utils/api'

export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'completed'
  category: 'environmental' | 'social' | 'governance'
  due_date: string
  assigned_user_id?: string
  evidence_count: number
  required_evidence: number
  compliance_context?: string
  action_required?: string
  framework_tags?: string[]
}

export interface Evidence {
  id: string
  task_id: string
  original_filename: string
  file_size: number
  mime_type: string
  uploaded_by: string
  uploaded_at: string
}

// Get tasks with filters
export const useTasks = (filters?: {
  status?: string
  category?: string
  assigned_user_id?: string
}) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksAPI.getTasks(filters).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get single task
export const useTask = (taskId: string) => {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksAPI.getTask(taskId).then(res => res.data),
    enabled: !!taskId,
  })
}

// Update task status
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      tasksAPI.updateTaskStatus(taskId, status),
    onSuccess: (_, { taskId }) => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
    },
  })
}

// Generate tasks for company
export const useGenerateTasks = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (companyId: string) => tasksAPI.generateTasks(companyId),
    onSuccess: () => {
      // Invalidate tasks to refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// Get task evidence
export const useTaskEvidence = (taskId: string) => {
  return useQuery({
    queryKey: ['evidence', taskId],
    queryFn: () => evidenceAPI.getTaskEvidence(taskId).then(res => res.data),
    enabled: !!taskId,
  })
}

// Upload evidence
export const useUploadEvidence = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, file }: { taskId: string; file: File }) =>
      evidenceAPI.uploadEvidence(taskId, file),
    onSuccess: (_, { taskId }) => {
      // Invalidate evidence and tasks to update counts
      queryClient.invalidateQueries({ queryKey: ['evidence', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
    },
  })
}

// Delete evidence
export const useDeleteEvidence = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (evidenceId: string) => evidenceAPI.deleteEvidence(evidenceId),
    onSuccess: () => {
      // Invalidate all evidence queries
      queryClient.invalidateQueries({ queryKey: ['evidence'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// Download evidence
export const useDownloadEvidence = () => {
  return useMutation({
    mutationFn: async (evidenceId: string) => {
      const response = await evidenceAPI.downloadEvidence(evidenceId)
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      
      // Extract filename from response headers if available
      const contentDisposition = response.headers['content-disposition']
      let filename = 'download'
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      // Create temporary link and click it
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return response
    },
  })
}