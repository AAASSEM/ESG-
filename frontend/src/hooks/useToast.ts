/**
 * Toast notifications hook for user feedback
 */

import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface UseToastReturn {
  toasts: Toast[];
  showSuccess: (message: string, title?: string, duration?: number) => void;
  showError: (message: string, title?: string, duration?: number) => void;
  showWarning: (message: string, title?: string, duration?: number) => void;
  showInfo: (message: string, title?: string, duration?: number) => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

let toastCounter = 0;

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => `toast-${++toastCounter}-${Date.now()}`;

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = { id, ...toast };
    
    setToasts(prev => [...prev, newToast]);

    // Auto dismiss after duration
    const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 4000);
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showSuccess = useCallback((message: string, title?: string, duration?: number) => {
    addToast({
      type: 'success',
      title: title || 'Success',
      message,
      duration
    });
  }, [addToast]);

  const showError = useCallback((message: string, title?: string, duration?: number) => {
    addToast({
      type: 'error',
      title: title || 'Error',
      message,
      duration: duration || 6000 // Errors stay longer by default
    });
  }, [addToast]);

  const showWarning = useCallback((message: string, title?: string, duration?: number) => {
    addToast({
      type: 'warning',
      title: title || 'Warning',
      message,
      duration
    });
  }, [addToast]);

  const showInfo = useCallback((message: string, title?: string, duration?: number) => {
    addToast({
      type: 'info',
      title: title || 'Information',
      message,
      duration
    });
  }, [addToast]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    addToast(toast);
  }, [addToast]);

  return {
    toasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast,
    dismissToast,
    clearAllToasts
  };
};

// Global toast context for app-wide notifications
let globalToastManager: UseToastReturn | null = null;

export const setGlobalToastManager = (manager: UseToastReturn) => {
  globalToastManager = manager;
};

// Utility functions that can be used anywhere in the app
export const toast = {
  success: (message: string, title?: string) => {
    globalToastManager?.showSuccess(message, title);
  },
  error: (message: string, title?: string) => {
    globalToastManager?.showError(message, title);
  },
  warning: (message: string, title?: string) => {
    globalToastManager?.showWarning(message, title);
  },
  info: (message: string, title?: string) => {
    globalToastManager?.showInfo(message, title);
  }
};