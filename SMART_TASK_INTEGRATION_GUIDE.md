# Smart Task Management Integration Guide

## Overview

The Smart Task Management system provides intelligent task updates that preserve completed work while intelligently managing changes to your ESG task list. This guide shows you how to integrate the smart task management features into your frontend.

## Backend Endpoints

### 1. Preview Changes
```http
POST /api/esg/scoping/{company_id}/preview
```

**Purpose**: Shows exactly what changes will be made without applying them.

**Request Body**:
```json
{
  "sector": "hospitality",
  "answers": {
    "question_1": "yes",
    "question_2": "no"
  },
  "preferences": {},
  "location_data": []
}
```

**Response**:
```json
{
  "company_id": "123",
  "sector": "hospitality", 
  "preview": {
    "tasks_to_preserve": [...],
    "tasks_to_update": [...], 
    "tasks_to_remove": [...],
    "tasks_to_add": [...],
    "summary": {
      "total_changes": 5,
      "has_destructive_changes": false,
      "preserve_count": 8,
      "update_count": 2,
      "remove_count": 0,
      "add_count": 3
    }
  },
  "recommendations": {
    "safe_to_proceed": true,
    "warnings": [],
    "benefits": [
      "Will preserve 8 existing tasks",
      "Will add 3 new tasks based on updated scoping"
    ]
  }
}
```

### 2. Apply Smart Updates
```http
POST /api/esg/scoping/{company_id}/update
```

**Purpose**: Applies the smart task management changes to the database.

**Request Body**: Same as preview endpoint

**Response**:
```json
{
  "message": "ESG scoping updated successfully with smart task management",
  "sector": "hospitality",
  "company_id": "123",
  "results": {
    "tasks_preserved": 8,
    "tasks_updated": 2, 
    "tasks_added": 3,
    "tasks_removed": 0,
    "total_tasks": 13
  }
}
```

### 3. Get Current Data for Editing
```http
GET /api/esg/scoping/{company_id}/edit-data
```

**Purpose**: Gets current scoping data and task summary for the editing interface.

**Response**:
```json
{
  "company_id": "123",
  "current_scoping_data": {...},
  "current_sector": "hospitality",
  "task_summary": {
    "total": 10,
    "completed": 3,
    "in_progress": 2,
    "todo": 5
  },
  "warnings": {
    "has_completed_tasks": true,
    "completed_count": 3,
    "message": "You have 3 completed tasks. Use the preview feature to ensure they are preserved."
  }
}
```

## Frontend Integration

### Step 1: Install the Component

Copy the `SmartScopingPreview` component from `frontend-react-component-smart-scoping.tsx` into your React project.

### Step 2: Basic Usage

```tsx
import SmartScopingPreview from './components/SmartScopingPreview';

const YourScopingComponent = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [scopingData, setScopingData] = useState(null);
  
  const handleScopingSubmit = (data) => {
    setScopingData(data);
    setShowPreview(true); // Show preview instead of directly submitting
  };

  const handlePreviewConfirm = () => {
    // This will be called when user confirms the changes
    console.log('Changes applied successfully!');
    // Refresh your task list or navigate to tasks page
  };

  return (
    <div>
      {/* Your existing scoping form */}
      
      <SmartScopingPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onProceed={handlePreviewConfirm}
        companyId={user.company_id}
        scopingData={scopingData}
        apiToken={authToken}
      />
    </div>
  );
};
```

### Step 3: Enhanced Integration with Form

```tsx
const EnhancedScopingForm = () => {
  const [formData, setFormData] = useState({});
  const [currentData, setCurrentData] = useState(null);
  
  // Load current data when component mounts
  useEffect(() => {
    loadCurrentScopingData();
  }, []);

  const loadCurrentScopingData = async () => {
    try {
      const response = await fetch(`/api/esg/scoping/${companyId}/edit-data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCurrentData(data);
      
      // Pre-populate form with existing data
      if (data.current_scoping_data) {
        setFormData(data.current_scoping_data);
      }
    } catch (error) {
      console.error('Failed to load current data:', error);
    }
  };

  const handleSubmit = () => {
    // Always show preview for data safety
    setShowPreview(true);
  };

  return (
    <div>
      {currentData?.warnings?.has_completed_tasks && (
        <Alert className="mb-4 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {currentData.warnings.message}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Your form fields */}
      
      <Button onClick={handleSubmit}>
        Update Scoping
      </Button>
    </div>
  );
};
```

## Key Features Explained

### 1. **Data Preservation**
- ✅ **Completed tasks are NEVER removed**
- ✅ **High similarity tasks (80%+) are preserved unchanged**
- ✅ **Conservative removal policy** - only removes tasks with clear contradictions

### 2. **Smart Matching**
- Uses weighted similarity scoring:
  - **Title similarity**: 40% weight
  - **Category matching**: 20% weight  
  - **Framework overlap**: 20% weight
  - **Description similarity**: 20% weight

### 3. **Preview Transparency**
- Shows exactly what will change before applying
- Color-coded impact analysis
- Detailed reasoning for each decision
- Warning system for destructive changes

### 4. **User Experience**
- **Preview Dialog**: Shows all changes before applying
- **Impact Summary**: Quick overview of changes
- **Warning System**: Alerts for potentially destructive operations
- **Success Feedback**: Accurate counts of what actually happened

## Best Practices

### 1. Always Use Preview First
```tsx
// ✅ Good - Always preview changes
const handleScopingUpdate = (data) => {
  setShowPreview(true); // Let user see what will happen
};

// ❌ Bad - Direct update without preview
const handleScopingUpdate = async (data) => {
  await updateScoping(data); // User has no idea what changed
};
```

### 2. Handle Edge Cases
```tsx
const handlePreviewError = (error) => {
  if (error.includes('Sector is required')) {
    showError('Please select a business sector before updating.');
  } else if (error.includes('No questions found')) {
    showError('Selected sector is not yet supported. Please try another sector.');
  } else {
    showError('Failed to generate preview. Please try again.');
  }
};
```

### 3. Provide Clear Feedback
```tsx
const handleSuccess = (result) => {
  const message = `Scoping updated successfully! ` +
    `${result.tasks_preserved} tasks preserved, ` +
    `${result.tasks_added} new tasks added, ` +
    `${result.tasks_updated} tasks updated.`;
  
  showSuccess(message);
  
  // Refresh task list
  refreshTasks();
};
```

## Error Handling

```tsx
const handleApiError = (error, context) => {
  console.error(`Smart scoping ${context} failed:`, error);
  
  if (error.status === 403) {
    showError('You do not have permission to modify this company\'s scoping.');
  } else if (error.status === 404) {
    showError('Company not found. Please check your access permissions.');
  } else if (error.status === 400) {
    showError('Invalid scoping data. Please check your form inputs.');
  } else {
    showError(`Failed to ${context}. Please try again or contact support.`);
  }
};
```

## Testing

Test the smart task management with these scenarios:

1. **No existing tasks** - Should create new tasks normally
2. **Some completed tasks** - Should preserve all completed tasks
3. **Similar tasks** - Should preserve high-similarity tasks
4. **Category changes** - Should update tasks intelligently
5. **Framework changes** - Should handle framework updates correctly

## Migration from Old System

If you have an existing scoping system, you can migrate by:

1. **Replace direct scoping endpoints** with smart preview/update endpoints
2. **Add the preview component** to your scoping flow
3. **Update success messages** to show actual results instead of generic messages
4. **Add warnings** for users with completed tasks

The smart task management system is backward compatible and will work even if no existing tasks are present.