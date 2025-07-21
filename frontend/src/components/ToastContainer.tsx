/**
 * Toast Container Component for displaying notifications
 */

import React, { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useToast, setGlobalToastManager, Toast } from '../hooks/useToast';

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getAlertStyle = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  return (
    <Alert className={`${getAlertStyle()} shadow-lg animate-in slide-in-from-right-full duration-300`}>
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <AlertTitle className="text-sm font-medium mb-1">
              {toast.title}
            </AlertTitle>
          )}
          <AlertDescription className="text-sm">
            {toast.message}
          </AlertDescription>
          {toast.action && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toast.action.onClick}
                className="h-8 text-xs"
              >
                {toast.action.label}
              </Button>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-black/10"
          onClick={() => onDismiss(toast.id)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </Alert>
  );
};

const ToastContainer: React.FC = () => {
  const toastManager = useToast();
  
  // Set global toast manager for app-wide usage
  useEffect(() => {
    setGlobalToastManager(toastManager);
  }, [toastManager]);

  if (toastManager.toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2">
      {toastManager.toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={toastManager.dismissToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;