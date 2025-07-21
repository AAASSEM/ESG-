/**
 * Task Management Component with Smart Update Integration
 * Handles task loading, display, and syncing with proper error handling
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  User,
  Calendar,
  FileText,
  Database
} from 'lucide-react';

import { taskStorage, Task } from '../services/taskStorage';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

interface TaskManagementProps {
  companyId?: string;
  className?: string;
}

const TaskManagement: React.FC<TaskManagementProps> = ({
  companyId,
  className = ''
}) => {
  const { user, token } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const effectiveCompanyId = companyId || user?.company_id;

  // Load tasks with proper error handling
  const loadTasks = useCallback(async (forceRefresh = false) => {
    if (!effectiveCompanyId) {
      console.log('No company ID available');
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let loadedTasks: Task[] = [];

      if (forceRefresh && token) {
        // Force refresh from server
        console.log('Force refreshing tasks from server...');
        try {
          loadedTasks = await taskStorage.forceRefreshFromServer(effectiveCompanyId, token);
          setLastSync(new Date());
          showInfo(`Refreshed ${loadedTasks.length} tasks from server`);
        } catch (serverError) {
          console.error('Failed to refresh from server:', serverError);
          // Fallback to localStorage
          loadedTasks = taskStorage.getTasks(effectiveCompanyId);
          showError('Failed to refresh from server, showing cached tasks');
        }
      } else {
        // Try localStorage first
        loadedTasks = taskStorage.getTasks(effectiveCompanyId);
        
        // If no local tasks and we have a token, try server
        if ((!loadedTasks || loadedTasks.length === 0) && token) {
          console.log('No local tasks found, fetching from server...');
          try {
            loadedTasks = await taskStorage.updateTasksFromServer(effectiveCompanyId, token);
            setLastSync(new Date());
          } catch (serverError) {
            console.error('Failed to fetch from server:', serverError);
            // Continue with empty array
          }
        }
      }
      
      setTasks(loadedTasks || []);
      console.log(`Loaded ${loadedTasks?.length || 0} tasks`);
    } catch (error) {
      console.error('Error loading tasks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks';
      setError(errorMessage);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId, token, showError, showInfo]);

  // Initial load
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Listen for task updates from scoping or other components
  useEffect(() => {
    const handleTasksUpdated = (event: CustomEvent) => {
      console.log('Tasks updated event received:', event.detail);
      if (event.detail?.companyId === effectiveCompanyId) {
        loadTasks(); // Reload tasks when they're updated
      }
    };

    const handleTasksCleared = (event: CustomEvent) => {
      console.log('Tasks cleared event received:', event.detail);
      if (event.detail?.companyId === effectiveCompanyId) {
        setTasks([]);
      }
    };

    window.addEventListener('tasksUpdated', handleTasksUpdated as EventListener);
    window.addEventListener('tasksCleared', handleTasksCleared as EventListener);
    
    return () => {
      window.removeEventListener('tasksUpdated', handleTasksUpdated as EventListener);
      window.removeEventListener('tasksCleared', handleTasksCleared as EventListener);
    };
  }, [effectiveCompanyId, loadTasks]);

  // Handle task status updates
  const handleTaskStatusUpdate = (taskId: string, newStatus: Task['status']) => {
    try {
      taskStorage.updateTaskStatus(taskId, newStatus);
      const updatedTasks = taskStorage.getTasks(effectiveCompanyId);
      setTasks(updatedTasks);
      showSuccess(`Task status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update task status:', error);
      showError('Failed to update task status');
    }
  };

  // Get task statistics
  const getTaskStats = () => {
    const stats = taskStorage.getTaskStats(effectiveCompanyId);
    return stats;
  };

  const stats = getTaskStats();

  // Filter tasks by category
  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'todo':
        return tasks.filter(t => t.status === 'todo');
      case 'in_progress':
        return tasks.filter(t => t.status === 'in_progress');
      case 'completed':
        return tasks.filter(t => t.status === 'completed');
      case 'environmental':
        return tasks.filter(t => t.category === 'environmental');
      case 'social':
        return tasks.filter(t => t.category === 'social');
      case 'governance':
        return tasks.filter(t => t.category === 'governance');
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();


  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={
                task.status === 'completed' ? 'default' :
                task.status === 'in_progress' ? 'secondary' : 'outline'
              }>
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {task.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {task.priority}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}
            {task.assigned_user && task.assigned_user !== 'Unassigned' && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <User className="w-3 h-3" />
                {task.assigned_user}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {task.description && (
          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.evidence_count > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <FileText className="w-3 h-3" />
                {task.evidence_count}/{task.required_evidence} evidence
              </div>
            )}
            {task.frameworks && task.frameworks.length > 0 && (
              <div className="text-xs text-gray-500">
                {task.frameworks.join(', ')}
              </div>
            )}
          </div>
          
          <div className="flex gap-1">
            {task.status !== 'completed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTaskStatusUpdate(
                  task.id, 
                  task.status === 'todo' ? 'in_progress' : 'completed'
                )}
                className="text-xs h-6"
              >
                {task.status === 'todo' ? 'Start' : 'Complete'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!effectiveCompanyId) {
    return (
      <Card className={`max-w-2xl mx-auto ${className}`}>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Company ID Required
          </h3>
          <p className="text-gray-600">
            Please ensure you're logged in and have access to a company to view tasks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Task Management
                <Badge variant="outline">{tasks.length} tasks</Badge>
              </CardTitle>
              {lastSync && (
                <p className="text-sm text-gray-600 mt-1">
                  Last synced: {lastSync.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadTasks(true)}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
            {stats.total > 0 && (
              <Progress 
                value={(stats.completed / stats.total) * 100} 
                className="mt-2 h-1" 
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.overdue}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading tasks...</p>
          </CardContent>
        </Card>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Found</h3>
            <p className="text-gray-600 mb-4">
              Complete the ESG scoping assessment to generate your personalized task list.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-7 w-full">
                <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
                <TabsTrigger value="todo">To Do ({stats.todo})</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress ({stats.in_progress})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
                <TabsTrigger value="environmental">Environmental</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
                <TabsTrigger value="governance">Governance</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No tasks in this category</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskManagement;