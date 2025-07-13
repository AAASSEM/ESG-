// Task Storage Service - manages tasks in localStorage
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
  private storageKey = 'esg_tasks';

  // Get all tasks
  getTasks(): Task[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }

  // Save tasks
  saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
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
    localStorage.removeItem(this.storageKey);
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
export type { Task };