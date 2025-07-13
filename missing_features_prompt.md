# Missing Features Implementation - Claude Code Prompt

## Context
I have a partially implemented Locations Step component for an ESG Data Wizard. The current implementation has several missing features that need to be completed to match the full specification. Please implement the missing functionality.

## Current Issues to Fix:

### 1. **Complete the Truncated Component**
The component code was cut off in the middle. Please complete the entire component including:
- Finish the `renderLocationBasicInfo()` function
- Implement `renderSubBuildingsStep()` function
- Implement `renderUtilitiesStep()` function
- Complete all missing render functions and validation logic

### 2. **Implement Missing Render Functions**

#### **Sub-Buildings Step (currentSubStep === 1)**
```typescript
const renderSubBuildingsStep = () => {
  // Should render:
  // 1. List of all sub-buildings based on subBuildingCount
  // 2. For each sub-building: name, function, floor area, occupancy
  // 3. Real-time validation showing total vs. main location limits
  // 4. Auto-generate sub-building names with smart defaults
  // 5. Validation warnings when totals exceed main location
}
```

#### **Utilities Step (currentSubStep === 2)**
```typescript
const renderUtilitiesStep = () => {
  // Should render all utilities for current location:
  // 1. Electricity metering (separate/shared with consumption input)
  // 2. Water metering (separate/shared with consumption input)
  // 3. District Cooling (if applicable to sector)
  // 4. Natural Gas (for manufacturing/healthcare)
  // 5. LPG (for hospitality)
  // 6. Shared meter allocation with percentage inputs
  // 7. Usage benchmarks validation with color coding
}
```

### 3. **Implement Shared Meter Allocation Logic**

When a utility has `separateMeter: false`, show:
```typescript
interface SharedMeterConfig {
  sharedWith: string[]; // List of other buildings sharing the meter
  percentageUsage: number; // This building's percentage (0-100)
  allocationMethod: string; // How the percentage was determined
  totalPercentage?: number; // Running total across all buildings
}
```

**Requirements:**
- Multi-select dropdown for "Shared With" (other sub-buildings)
- Percentage input with validation (total must equal 100%)
- Allocation method dropdown
- Real-time validation showing total percentage across shared buildings
- Warning when total percentage ≠ 100%

### 4. **Implement Monthly Consumption Tracking**

For each utility with a meter, add:
```typescript
interface ConsumptionData {
  monthlyAvgConsumption: number;
  unit: string; // kWh, m³, liters, etc.
  lastMonthActual?: number;
  estimatedAnnual?: number;
}
```

**Features needed:**
- Consumption input fields for each utility
- Auto-calculate estimated annual consumption
- Compare against sector benchmarks
- Color-coded status (efficient/average/inefficient)
- Smart unit selection based on utility type

### 5. **Add Usage Benchmarks Validation**

Implement real-time validation using the `usageBenchmarks` object:
```typescript
const validateConsumption = (consumption: number, utility: string, sector: string) => {
  // Compare against benchmarks
  // Return status with color coding
  // Show recommendations for improvement
}
```

**Visual indicators:**
- 🟢 Green: Efficient (below benchmark)
- 🟡 Yellow: Average (within normal range)
- 🔴 Red: Inefficient (above benchmark)
- Show specific recommendations for improvement

### 6. **Implement Sector-Specific Utilities**

Based on `businessSector` and `locationType`, show relevant utilities:

```typescript
const getSectorUtilities = (sector: string, locationType: string) => {
  // Hospitality: electricity, water, districtCooling, lpg
  // Manufacturing: electricity, water, naturalGas, districtCooling
  // Healthcare: electricity, water, naturalGas
  // Education: electricity, water
  // Others: electricity, water
}
```

### 7. **Add Smart Defaults and Auto-suggestions**

```typescript
const getSmartDefaults = (locationType: string, floorArea: number, employees: number) => {
  // Auto-suggest building names based on function
  // Estimate consumption based on floor area and sector benchmarks
  // Pre-populate utility providers based on emirate
  // Suggest meter configuration based on building size
}
```

### 8. **Implement Comprehensive Validation**

```typescript
const validateLocation = (location: LocationData) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  // Validate area/occupancy totals
  // Check utility percentage allocations
  // Validate consumption against benchmarks
  // Check framework compliance requirements
  
  return { errors, warnings, isValid: errors.length === 0 };
}
```

### 9. **Add Progress Tracking and Navigation**

```typescript
const getSubStepProgress = () => {
  // Calculate progress within current location
  // Show step indicators for: Basic Info → Sub-Buildings → Utilities
  // Handle navigation between sub-steps
  // Validate before allowing progression
}
```

### 10. **Implement Bulk Import Hint**

For companies with 10+ locations, show:
```typescript
const renderBulkImportOption = () => {
  // Show informational card about bulk import
  // Provide Excel template download
  // Explain how to use bulk import after wizard completion
}
```

## Implementation Requirements:

### **Code Structure:**
- Complete the truncated component with all missing functions
- Maintain TypeScript types and interfaces
- Keep the existing styling approach
- Ensure responsive design
- Add proper error handling

### **User Experience:**
- Smooth navigation between sub-steps
- Real-time validation with helpful messages
- Clear progress indicators
- Auto-save functionality for complex forms
- Helpful tooltips and explanations

### **Data Validation:**
- Real-time validation as user types
- Clear error messages with suggestions
- Warning messages for potential issues
- Prevent progression with critical errors
- Success indicators when validation passes

### **Performance:**
- Efficient state management for complex nested data
- Debounced validation for input fields
- Optimized re-rendering for large datasets
- Progressive loading for multiple locations

## Expected Output:

Please provide the complete, fully functional component that includes:

1. ✅ All missing render functions implemented
2. ✅ Shared meter allocation with percentage validation
3. ✅ Monthly consumption tracking with benchmarks
4. ✅ Sector-specific utilities configuration
5. ✅ Smart defaults and auto-suggestions
6. ✅ Comprehensive validation with helpful messages
7. ✅ Smooth navigation and progress tracking
8. ✅ Bulk import guidance for large companies
9. ✅ Complete TypeScript types and interfaces
10. ✅ Responsive design with consistent styling

The component should handle all edge cases, provide excellent user experience, and generate clean, structured data for the ESG task generation system.