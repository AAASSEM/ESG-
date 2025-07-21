import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Info, Plus, Minus, Edit } from 'lucide-react';

interface TaskChangePreview {
  tasks_to_preserve: TaskPreviewItem[];
  tasks_to_update: TaskPreviewItem[];
  tasks_to_remove: TaskPreviewItem[];
  tasks_to_add: TaskPreviewItem[];
  summary: {
    total_changes: number;
    has_destructive_changes: boolean;
    preserve_count: number;
    update_count: number;
    remove_count: number;
    add_count: number;
  };
}

interface TaskPreviewItem {
  existing_task?: {
    id: string;
    title: string;
    status: string;
    category: string;
    is_completed: boolean;
  };
  new_task_data?: {
    title: string;
    category: string;
    description: string;
  };
  matched_new_task?: {
    title: string;
    category: string;
  };
  task_data?: {
    title: string;
    category: string;
    description: string;
  };
  similarity?: number;
  reason?: string;
  changes?: string[];
}

interface PreviewResponse {
  company_id: string;
  sector: string;
  preview: TaskChangePreview;
  current_state: {
    total_existing_tasks: number;
    completed_tasks: number;
    new_tasks_generated: number;
  };
  recommendations: {
    safe_to_proceed: boolean;
    warnings: string[];
    benefits: string[];
  };
}

interface SmartScopingPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  companyId: string;
  scopingData: any;
  apiToken: string;
}

const SmartScopingPreview: React.FC<SmartScopingPreviewProps> = ({
  isOpen,
  onClose,
  onProceed,
  companyId,
  scopingData,
  apiToken
}) => {
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && scopingData) {
      fetchPreview();
    }
  }, [isOpen, scopingData, companyId]);

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/esg/scoping/${companyId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify(scopingData)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch preview: ${response.statusText}`);
      }

      const data = await response.json();
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preview');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = async () => {
    try {
      const response = await fetch(`/api/esg/scoping/${companyId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify(scopingData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update scoping: ${response.statusText}`);
      }

      const result = await response.json();
      onProceed();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update scoping');
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'preserve':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'update':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'remove':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'add':
        return <Plus className="w-4 h-4 text-green-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getChangeBadgeColor = (type: string) => {
    switch (type) {
      case 'preserve':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'remove':
        return 'bg-red-100 text-red-800';
      case 'add':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analyzing Changes...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Analyzing impact on your existing tasks...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview Error</DialogTitle>
          </DialogHeader>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={fetchPreview}>
              Retry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!preview) {
    return null;
  }

  const TaskPreviewSection: React.FC<{
    title: string;
    items: TaskPreviewItem[];
    type: string;
    emptyMessage: string;
  }> = ({ title, items, type, emptyMessage }) => (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getChangeIcon(type)}
          {title}
          <Badge className={getChangeBadgeColor(type)}>
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 5).map((item, index) => {
              const task = item.existing_task || item.new_task_data || item.task_data;
              return (
                <div key={index} className="border rounded p-3 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{task?.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Category: {task?.category}
                        {item.existing_task?.is_completed && (
                          <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                            Completed
                          </Badge>
                        )}
                      </p>
                      {item.reason && (
                        <p className="text-xs text-blue-600 mt-1">{item.reason}</p>
                      )}
                      {item.changes && item.changes.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">Changes:</p>
                          <ul className="text-xs text-gray-600 ml-2">
                            {item.changes.map((change, i) => (
                              <li key={i}>• {change}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {item.similarity && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(item.similarity * 100)}% match
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
            {items.length > 5 && (
              <p className="text-xs text-gray-500 text-center">
                ... and {items.length - 5} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Smart Scoping Update Preview</DialogTitle>
          <p className="text-sm text-gray-600">
            Review the changes that will be made to your task list
          </p>
        </DialogHeader>

        {/* Summary Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {preview.current_state.completed_tasks}
              </div>
              <div className="text-sm text-gray-600">Completed Tasks</div>
              <div className="text-xs text-green-600 mt-1">Will be preserved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {preview.preview.summary.preserve_count}
              </div>
              <div className="text-sm text-gray-600">Tasks Preserved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {preview.preview.summary.update_count}
              </div>
              <div className="text-sm text-gray-600">Tasks Updated</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {preview.preview.summary.add_count}
              </div>
              <div className="text-sm text-gray-600">New Tasks</div>
            </CardContent>
          </Card>
        </div>

        {/* Warnings and Recommendations */}
        {preview.recommendations.warnings.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Warning:</strong> {preview.recommendations.warnings[0]}
            </AlertDescription>
          </Alert>
        )}

        {preview.recommendations.safe_to_proceed && (
          <Alert className="border-green-200 bg-green-50 mb-4">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Safe to proceed:</strong> This update will preserve all your completed work.
            </AlertDescription>
          </Alert>
        )}

        {/* Benefits */}
        {preview.recommendations.benefits.length > 0 && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Benefits of this update
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="text-sm space-y-1">
                {preview.recommendations.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Task Change Sections */}
        <div className="space-y-4">
          <TaskPreviewSection
            title="Tasks to Preserve"
            items={preview.preview.tasks_to_preserve}
            type="preserve"
            emptyMessage="No tasks will be preserved (this is unusual - you may want to review your scoping data)"
          />

          <TaskPreviewSection
            title="Tasks to Update"
            items={preview.preview.tasks_to_update}
            type="update"
            emptyMessage="No existing tasks will be updated"
          />

          <TaskPreviewSection
            title="New Tasks to Add"
            items={preview.preview.tasks_to_add}
            type="add"
            emptyMessage="No new tasks will be added"
          />

          {preview.preview.tasks_to_remove.length > 0 && (
            <TaskPreviewSection
              title="Tasks to Remove"
              items={preview.preview.tasks_to_remove}
              type="remove"
              emptyMessage="No tasks will be removed"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {preview.preview.summary.total_changes} total changes • 
            Sector: {preview.sector}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleProceed}
              className={preview.recommendations.safe_to_proceed ? '' : 'bg-yellow-600 hover:bg-yellow-700'}
            >
              {preview.recommendations.safe_to_proceed ? 'Apply Changes' : 'Proceed with Caution'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartScopingPreview;