// User Storage Service - manages users in localStorage
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'contributor' | 'viewer';
  status: 'active' | 'inactive';
  avatar: string;
  created_at: string;
  last_login?: string;
  department?: string;
  phone?: string;
  permissions: {
    dashboard_access: boolean;
    data_entry: boolean;
    report_generation: boolean;
    user_management: boolean;
    task_management: boolean;
    evidence_upload: boolean;
  };
}

interface ActivityLog {
  id: string;
  type: 'user_added' | 'user_updated' | 'user_deleted' | 'role_changed' | 'user_login' | 'user_logout';
  description: string;
  user_id: string;
  performed_by: string;
  timestamp: string;
  details?: any;
}

class UserStorageService {
  private usersKey = 'esg_users';
  private activityKey = 'esg_user_activity';
  private currentUserKey = 'current_user';

  // Get all users
  getUsers(): User[] {
    try {
      const stored = localStorage.getItem(this.usersKey);
      if (!stored) {
        // Initialize with default admin user if no users exist
        const defaultAdmin = this.createDefaultAdmin();
        this.saveUsers([defaultAdmin]);
        return [defaultAdmin];
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading users:', error);
      const defaultAdmin = this.createDefaultAdmin();
      return [defaultAdmin];
    }
  }

  // Create default admin user
  private createDefaultAdmin(): User {
    return {
      id: 'admin_default',
      name: 'System Administrator',
      email: 'admin@company.ae',
      role: 'admin',
      status: 'active',
      avatar: 'SA',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      department: 'IT',
      permissions: {
        dashboard_access: true,
        data_entry: true,
        report_generation: true,
        user_management: true,
        task_management: true,
        evidence_upload: true,
      }
    };
  }

  // Save users
  saveUsers(users: User[]): void {
    try {
      localStorage.setItem(this.usersKey, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  // Add a new user
  addUser(userData: Omit<User, 'id' | 'created_at' | 'avatar' | 'permissions'>): User {
    const users = this.getUsers();
    
    // Generate avatar from name
    const nameParts = userData.name.split(' ');
    const avatar = nameParts.length >= 2 
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : userData.name.substring(0, 2).toUpperCase();

    // Set permissions based on role
    const permissions = this.getPermissionsByRole(userData.role);

    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      avatar,
      permissions,
    };
    
    users.push(newUser);
    this.saveUsers(users);
    
    // Log activity
    this.logActivity({
      type: 'user_added',
      description: `New user ${newUser.name} added with ${newUser.role} role`,
      user_id: newUser.id,
      performed_by: this.getCurrentUser()?.id || 'system',
      details: { role: newUser.role, email: newUser.email }
    });
    
    return newUser;
  }

  // Update user
  updateUser(userId: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex >= 0) {
      const oldRole = users[userIndex].role;
      
      // Update permissions if role changed
      if (updates.role && updates.role !== oldRole) {
        updates.permissions = this.getPermissionsByRole(updates.role);
      }
      
      users[userIndex] = { ...users[userIndex], ...updates };
      this.saveUsers(users);
      
      // Log activity for role changes
      if (updates.role && updates.role !== oldRole) {
        this.logActivity({
          type: 'role_changed',
          description: `${users[userIndex].name} role changed from ${oldRole} to ${updates.role}`,
          user_id: userId,
          performed_by: this.getCurrentUser()?.id || 'system',
          details: { old_role: oldRole, new_role: updates.role }
        });
      }
      
      return users[userIndex];
    }
    
    return null;
  }

  // Delete user
  deleteUser(userId: string): boolean {
    const users = this.getUsers();
    const userToDelete = users.find(u => u.id === userId);
    
    if (userToDelete) {
      const filteredUsers = users.filter(u => u.id !== userId);
      this.saveUsers(filteredUsers);
      
      // Log activity
      this.logActivity({
        type: 'user_deleted',
        description: `User ${userToDelete.name} was deleted`,
        user_id: userId,
        performed_by: this.getCurrentUser()?.id || 'system',
        details: { email: userToDelete.email, role: userToDelete.role }
      });
      
      return true;
    }
    
    return false;
  }

  // Get user by ID
  getUserById(userId: string): User | undefined {
    const users = this.getUsers();
    return users.find(u => u.id === userId);
  }

  // Get user by email
  getUserByEmail(email: string): User | undefined {
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  // Update user status
  updateUserStatus(userId: string, status: User['status']): void {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex >= 0) {
      users[userIndex].status = status;
      this.saveUsers(users);
      
      // Log activity
      this.logActivity({
        type: 'user_updated',
        description: `${users[userIndex].name} status changed to ${status}`,
        user_id: userId,
        performed_by: this.getCurrentUser()?.id || 'system',
        details: { new_status: status }
      });
    }
  }

  // Record user login
  recordLogin(userId: string): void {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex >= 0) {
      users[userIndex].last_login = new Date().toISOString();
      this.saveUsers(users);
      
      // Set as current user
      localStorage.setItem(this.currentUserKey, JSON.stringify(users[userIndex]));
      
      // Log activity
      this.logActivity({
        type: 'user_login',
        description: `${users[userIndex].name} logged in`,
        user_id: userId,
        performed_by: userId,
        details: { timestamp: new Date().toISOString() }
      });
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(this.currentUserKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Set current user
  setCurrentUser(user: User): void {
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
  }

  // Logout current user
  logout(): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.logActivity({
        type: 'user_logout',
        description: `${currentUser.name} logged out`,
        user_id: currentUser.id,
        performed_by: currentUser.id,
        details: { timestamp: new Date().toISOString() }
      });
    }
    localStorage.removeItem(this.currentUserKey);
  }

  // Get permissions by role
  private getPermissionsByRole(role: User['role']) {
    const rolePermissions = {
      admin: {
        dashboard_access: true,
        data_entry: true,
        report_generation: true,
        user_management: true,
        task_management: true,
        evidence_upload: true,
      },
      manager: {
        dashboard_access: true,
        data_entry: true,
        report_generation: true,
        user_management: false,
        task_management: true,
        evidence_upload: true,
      },
      contributor: {
        dashboard_access: true,
        data_entry: true,
        report_generation: false,
        user_management: false,
        task_management: true,
        evidence_upload: true,
      },
      viewer: {
        dashboard_access: true,
        data_entry: false,
        report_generation: false,
        user_management: false,
        task_management: false,
        evidence_upload: false,
      }
    };
    
    return rolePermissions[role];
  }

  // Activity logging
  private logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    try {
      const activities = this.getActivityLogs();
      const newActivity: ActivityLog = {
        ...activity,
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };
      
      activities.unshift(newActivity); // Add to beginning
      
      // Keep only last 100 activities
      const trimmedActivities = activities.slice(0, 100);
      
      localStorage.setItem(this.activityKey, JSON.stringify(trimmedActivities));
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // Get activity logs
  getActivityLogs(): ActivityLog[] {
    try {
      const stored = localStorage.getItem(this.activityKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading activity logs:', error);
      return [];
    }
  }

  // Get user statistics
  getUserStats() {
    const users = this.getUsers();
    const activities = this.getActivityLogs();
    
    return {
      total_users: users.length,
      active_users: users.filter(u => u.status === 'active').length,
      inactive_users: users.filter(u => u.status === 'inactive').length,
      admins: users.filter(u => u.role === 'admin').length,
      managers: users.filter(u => u.role === 'manager').length,
      contributors: users.filter(u => u.role === 'contributor').length,
      viewers: users.filter(u => u.role === 'viewer').length,
      recent_logins: users.filter(u => {
        if (!u.last_login) return false;
        const loginDate = new Date(u.last_login);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return loginDate > oneDayAgo;
      }).length,
      total_activities: activities.length,
    };
  }

  // Search users
  searchUsers(query: string, role?: string, status?: string): User[] {
    const users = this.getUsers();
    
    return users.filter(user => {
      const matchesQuery = !query || 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase());
      
      const matchesRole = !role || role === 'all' || user.role === role;
      const matchesStatus = !status || status === 'all' || user.status === status;
      
      return matchesQuery && matchesRole && matchesStatus;
    });
  }

  // Clear all data (for testing)
  clearAllData(): void {
    localStorage.removeItem(this.usersKey);
    localStorage.removeItem(this.activityKey);
    localStorage.removeItem(this.currentUserKey);
  }
}

// Export singleton instance
export const userStorage = new UserStorageService();
export type { User, ActivityLog };