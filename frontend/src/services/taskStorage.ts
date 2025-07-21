// Task Storage Service - manages tasks in localStorage
interface EvidenceFile {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  category: 'environmental' | 'social' | 'governance';
  due_date: string;
  assigned_user?: string;
  assigned_user_id?: string;
  evidence_count: number;
  required_evidence: number;
  evidence_files: EvidenceFile[];
  
  // Additional ESG-specific fields
  frameworks: string[];
  priority: 'High' | 'Medium' | 'Low';
  compliance_context: string;
  action_required: string;
  framework_tags: string[];
  evidence_required: string[];
  created_from_assessment: boolean;
  sector: string;
  estimated_hours: number;
  compliance_level: string;
  regulatory_requirement: boolean;
  task_type: 'compliance' | 'monitoring' | 'improvement';
  created_at: string;
  audit_trail: {
    created_at: string;
    question_id?: number;
    answer?: string;
    triggered_by: string;
  };
}

class TaskStorageService {
  private static readonly TASKS_KEY = 'esg_tasks';
  private static readonly COMPANY_KEY = 'current_company_id';

  private getStorageKey(companyId?: string): string {
    // Make task storage user-specific by using company ID
    const targetCompanyId = companyId || this.getCurrentCompanyId();
    if (targetCompanyId) {
      return `${TaskStorageService.TASKS_KEY}_${targetCompanyId}`;
    }
    // Fallback to global key if no company found
    return TaskStorageService.TASKS_KEY;
  }

  // Get current company ID
  getCurrentCompanyId(): string | null {
    try {
      // First try the dedicated company key
      let companyId = localStorage.getItem(TaskStorageService.COMPANY_KEY);
      if (companyId) {
        return companyId;
      }
      
      // Fallback to user object
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      return currentUser.company_id || null;
    } catch (error) {
      console.error('Error getting company ID:', error);
      return null;
    }
  }

  // Set current company ID
  setCurrentCompanyId(companyId: string): void {
    localStorage.setItem(TaskStorageService.COMPANY_KEY, companyId);
  }

  // Get all tasks with proper error handling
  getTasks(companyId?: string): Task[] {
    try {
      const key = this.getStorageKey(companyId);
      const stored = localStorage.getItem(key);
      
      // Handle undefined, null, or empty string
      if (!stored || stored === 'undefined' || stored === 'null') {
        console.log(`No tasks found for storage key: ${key}`);
        return [];
      }

      try {
        const parsed = JSON.parse(stored);
        // Ensure it's an array
        if (!Array.isArray(parsed)) {
          console.error('Stored tasks is not an array:', parsed);
          localStorage.removeItem(key);
          return [];
        }

        // Ensure all tasks have evidence_files property
        return parsed.map((task: Task) => ({
          ...task,
          evidence_files: task.evidence_files || []
        }));
      } catch (parseError) {
        console.error('Failed to parse tasks:', parseError);
        console.error('Stored value:', stored);
        // Clear corrupted data
        localStorage.removeItem(key);
        return [];
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }

  // Save tasks with validation
  saveTasks(tasks: Task[], companyId?: string): void {
    try {
      // Validate tasks is a proper array
      if (!Array.isArray(tasks)) {
        console.error('Cannot save tasks: tasks is not an array', tasks);
        return;
      }

      const key = this.getStorageKey(companyId);
      localStorage.setItem(key, JSON.stringify(tasks));
      console.log(`Saved ${tasks.length} tasks to ${key}`);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('tasksUpdated', { 
        detail: { companyId: companyId || this.getCurrentCompanyId(), tasks } 
      }));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  // Update tasks after smart regeneration
  async updateTasksFromServer(companyId: string, token: string): Promise<Task[]> {
    try {
      console.log(`Fetching tasks from server for company ${companyId}`);
      
      const response = await fetch(`/api/tasks/?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Server response:', data);
      
      // Extract tasks from the response - backend returns TaskListResponse format
      const serverTasks = data.tasks || [];
      
      // Transform to frontend format
      const transformedTasks: Task[] = serverTasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        category: task.category,
        due_date: task.due_date || '',
        assigned_user: task.assigned_user || 'Unassigned',
        assigned_user_id: task.assigned_user_id,
        evidence_count: task.evidence?.length || 0,
        required_evidence: task.required_evidence_count || 0,
        evidence_files: task.evidence || [],
        frameworks: this.parseFrameworkTags(task.framework_tags),
        priority: this.mapPriority(task.priority),
        compliance_context: task.compliance_context || '',
        action_required: task.action_required || '',
        framework_tags: this.parseFrameworkTags(task.framework_tags),
        evidence_required: [],
        created_from_assessment: true,
        sector: task.sector || '',
        estimated_hours: task.estimated_hours || 0,
        compliance_level: '',
        regulatory_requirement: false,
        task_type: task.task_type || 'compliance',
        created_at: task.created_at || new Date().toISOString(),
        audit_trail: {
          created_at: task.created_at || new Date().toISOString(),
          triggered_by: 'task_generation'
        }
      }));
      
      // Save to localStorage
      this.saveTasks(transformedTasks, companyId);
      
      console.log(`Successfully fetched and saved ${transformedTasks.length} tasks`);
      return transformedTasks;
    } catch (error) {
      console.error('Error fetching tasks from server:', error);
      throw error;
    }
  }

  // Helper to parse framework tags
  private parseFrameworkTags(frameworkTags: any): string[] {
    if (!frameworkTags) return [];
    
    try {
      if (typeof frameworkTags === 'string') {
        return JSON.parse(frameworkTags);
      }
      if (Array.isArray(frameworkTags)) {
        return frameworkTags;
      }
      return [];
    } catch {
      return [];
    }
  }

  // Helper to map priority
  private mapPriority(priority: any): 'High' | 'Medium' | 'Low' {
    if (!priority) return 'Medium';
    const p = priority.toString().toLowerCase();
    if (p === 'high') return 'High';
    if (p === 'low') return 'Low';
    return 'Medium';
  }

  // Clear tasks for a company
  clearTasks(companyId?: string): void {
    const key = this.getStorageKey(companyId);
    localStorage.removeItem(key);
    console.log(`Cleared tasks for key: ${key}`);
    
    // Dispatch clear event
    window.dispatchEvent(new CustomEvent('tasksCleared', { 
      detail: { companyId: companyId || this.getCurrentCompanyId() } 
    }));
  }

  // Force refresh from server
  async forceRefreshFromServer(companyId: string, token: string): Promise<Task[]> {
    // Clear local data first
    this.clearTasks(companyId);
    // Fetch fresh data
    return this.updateTasksFromServer(companyId, token);
  }

  // Add a single task
  addTask(task: Omit<Task, 'id'>): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    tasks.push(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  // Add multiple tasks (for assessment results)
  addTasks(newTasks: Omit<Task, 'id'>[]): Task[] {
    const existingTasks = this.getTasks();
    const tasksToAdd = newTasks.map(task => ({
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }));
    
    const allTasks = [...existingTasks, ...tasksToAdd];
    this.saveTasks(allTasks);
    return tasksToAdd;
  }

  // Update task status
  updateTaskStatus(taskId: string, status: Task['status']): void {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex >= 0) {
      tasks[taskIndex].status = status;
      this.saveTasks(tasks);
    }
  }

  // Update task
  updateTask(taskId: string, updates: Partial<Task>): void {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex >= 0) {
      tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
      this.saveTasks(tasks);
    }
  }

  // Assign user to task
  assignUserToTask(taskId: string, userId: string, userName: string): void {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex >= 0) {
      tasks[taskIndex].assigned_user = userName;
      tasks[taskIndex].assigned_user_id = userId;
      this.saveTasks(tasks);
    }
  }

  // Unassign user from task
  unassignUserFromTask(taskId: string): void {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex >= 0) {
      tasks[taskIndex].assigned_user = 'Unassigned';
      delete tasks[taskIndex].assigned_user_id;
      this.saveTasks(tasks);
    }
  }

  // Get tasks assigned to a specific user
  getTasksByAssignedUser(userId: string): Task[] {
    const tasks = this.getTasks();
    return tasks.filter(t => t.assigned_user_id === userId);
  }

  // Delete task
  deleteTask(taskId: string): void {
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(t => t.id !== taskId);
    this.saveTasks(filteredTasks);
  }

  // Get task by ID
  getTaskById(taskId: string): Task | undefined {
    const tasks = this.getTasks();
    return tasks.find(t => t.id === taskId);
  }

  // Clear all tasks (for testing)
  clearAllTasks(): void {
    localStorage.removeItem(this.getStorageKey());
  }

  // Add evidence file to task
  addEvidenceFile(taskId: string, file: File, description?: string): void {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex >= 0) {
      const evidenceFile: EvidenceFile = {
        id: `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Current User', // In real app, get from auth context
        description: description || ''
      };
      
      if (!tasks[taskIndex].evidence_files) {
        tasks[taskIndex].evidence_files = [];
      }
      
      tasks[taskIndex].evidence_files.push(evidenceFile);
      tasks[taskIndex].evidence_count = tasks[taskIndex].evidence_files.length;
      
      // Automatically update task status when evidence is uploaded
      if (tasks[taskIndex].status === 'todo') {
        tasks[taskIndex].status = 'in_progress';
      }
      
      // If all required evidence is uploaded, mark as completed
      if (tasks[taskIndex].evidence_count >= tasks[taskIndex].required_evidence && 
          tasks[taskIndex].required_evidence > 0) {
        tasks[taskIndex].status = 'completed';
      }
      
      this.saveTasks(tasks);
    }
  }

  // Remove evidence file from task
  removeEvidenceFile(taskId: string, fileId: string): void {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex >= 0 && tasks[taskIndex].evidence_files) {
      tasks[taskIndex].evidence_files = tasks[taskIndex].evidence_files.filter(
        file => file.id !== fileId
      );
      tasks[taskIndex].evidence_count = tasks[taskIndex].evidence_files.length;
      
      // Update task status based on remaining evidence
      if (tasks[taskIndex].evidence_count === 0) {
        tasks[taskIndex].status = 'todo';
      } else if (tasks[taskIndex].evidence_count < tasks[taskIndex].required_evidence) {
        // If was completed but now missing required evidence, move to in_progress
        if (tasks[taskIndex].status === 'completed') {
          tasks[taskIndex].status = 'in_progress';
        }
      }
      
      this.saveTasks(tasks);
    }
  }

  // Get evidence files for a task
  getEvidenceFiles(taskId: string): EvidenceFile[] {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    return task?.evidence_files || [];
  }

  // Get tasks by category
  getTasksByCategory(category: Task['category']): Task[] {
    const tasks = this.getTasks();
    return tasks.filter(t => t.category === category);
  }

  // Get tasks by status
  getTasksByStatus(status: Task['status']): Task[] {
    const tasks = this.getTasks();
    return tasks.filter(t => t.status === status);
  }

  // Get tasks from assessment
  getAssessmentTasks(): Task[] {
    const tasks = this.getTasks();
    return tasks.filter(t => t.created_from_assessment);
  }

  // Get task statistics
  getTaskStats() {
    const tasks = this.getTasks();
    const now = new Date();
    
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => 
        new Date(t.due_date) < now && t.status !== 'completed'
      ).length,
      high_priority: tasks.filter(t => t.priority === 'High').length,
      regulatory: tasks.filter(t => t.regulatory_requirement).length,
      from_assessment: tasks.filter(t => t.created_from_assessment).length,
      assigned: tasks.filter(t => t.assigned_user && t.assigned_user !== 'Unassigned').length,
      unassigned: tasks.filter(t => !t.assigned_user || t.assigned_user === 'Unassigned').length,
    };
  }

  // Get progress statistics by category
  getProgressStats() {
    const tasks = this.getTasks();
    const totalTasks = tasks.length;
    
    if (totalTasks === 0) {
      return {
        overall: { completed: 0, total: 0, percentage: 0 },
        environmental: { completed: 0, total: 0, percentage: 0 },
        social: { completed: 0, total: 0, percentage: 0 },
        governance: { completed: 0, total: 0, percentage: 0 },
        evidence: { uploaded: 0, required: 0, percentage: 0 }
      };
    }

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const environmentalTasks = tasks.filter(t => t.category === 'environmental');
    const socialTasks = tasks.filter(t => t.category === 'social');
    const governanceTasks = tasks.filter(t => t.category === 'governance');
    
    const environmentalCompleted = environmentalTasks.filter(t => t.status === 'completed').length;
    const socialCompleted = socialTasks.filter(t => t.status === 'completed').length;
    const governanceCompleted = governanceTasks.filter(t => t.status === 'completed').length;
    
    const totalEvidenceRequired = tasks.reduce((sum, t) => sum + (t.required_evidence || 0), 0);
    const totalEvidenceUploaded = tasks.reduce((sum, t) => sum + (t.evidence_count || 0), 0);
    
    return {
      overall: {
        completed: completedTasks,
        total: totalTasks,
        percentage: Math.round((completedTasks / totalTasks) * 100)
      },
      environmental: {
        completed: environmentalCompleted,
        total: environmentalTasks.length,
        percentage: environmentalTasks.length > 0 ? Math.round((environmentalCompleted / environmentalTasks.length) * 100) : 0
      },
      social: {
        completed: socialCompleted,
        total: socialTasks.length,
        percentage: socialTasks.length > 0 ? Math.round((socialCompleted / socialTasks.length) * 100) : 0
      },
      governance: {
        completed: governanceCompleted,
        total: governanceTasks.length,
        percentage: governanceTasks.length > 0 ? Math.round((governanceCompleted / governanceTasks.length) * 100) : 0
      },
      evidence: {
        uploaded: totalEvidenceUploaded,
        required: totalEvidenceRequired,
        percentage: totalEvidenceRequired > 0 ? Math.round((totalEvidenceUploaded / totalEvidenceRequired) * 100) : 0
      }
    };
  }
}

// Export singleton instance
export const taskStorage = new TaskStorageService();
export type { Task, EvidenceFile };