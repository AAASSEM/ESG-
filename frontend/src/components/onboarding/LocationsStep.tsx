import React, { useState, useEffect } from 'react';

interface SharedMeterConfig {
  sharedWith: string[];
  percentageUsage: number;
  allocationMethod: string;
  totalPercentage?: number;
}

interface ConsumptionData {
  monthlyAvgConsumption: number;
  unit: string;
  lastMonthActual?: number;
  estimatedAnnual?: number;
}

interface UtilityData {
  separateMeter: boolean;
  meterNumber?: string;
  provider?: string;
  monthlyAvgConsumption?: number;
  unit?: string;
  lastMonthActual?: number;
  estimatedAnnual?: number;
  shared?: SharedMeterConfig;
}

interface SubBuildingData {
  id: string;
  name: string;
  function: string;
  floorArea: number;
  occupancy: number;
  utilities: {
    electricity: UtilityData;
    water: UtilityData;
  };
}

interface LocationData {
  id: string;
  name: string;
  address: string;
  emirate: string;
  locationType: string;
  totalFloorArea: number;
  floorAreaUnit: 'sqm' | 'sqft';
  totalEmployees: number;
  hasSubBuildings: boolean;
  subBuildings: SubBuildingData[];
  utilities: {
    electricity: UtilityData;
    water: UtilityData;
    districtCooling?: UtilityData;
    naturalGas?: UtilityData;
    lpg?: UtilityData;
  };
  jurisdiction: {
    emirate: string;
    municipality: string;
    freeZone: string | null;
    applicableFrameworks: string[];
  };
  businessSector?: string;
}

interface LocationsStepProps {
  onComplete: (locationData: LocationData[]) => void;
  onBack: () => void;
  initialData?: LocationData[];
  businessSector?: string;
}

interface ValidationResult {
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

interface UsageBenchmark {
  efficient: number;
  average: number;
  inefficient: number;
  unit: string;
}

const LocationsStep: React.FC<LocationsStepProps> = ({ 
  onComplete, 
  onBack, 
  initialData = [], 
  businessSector = 'general' 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentSubStep, setCurrentSubStep] = useState(0); // 0: Basic Info, 1: Sub-Buildings, 2: Utilities
  const [hasMultipleLocations, setHasMultipleLocations] = useState<boolean | null>(null);
  const [locationCount, setLocationCount] = useState<string>('');
  const [locations, setLocations] = useState<LocationData[]>(initialData);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [subBuildingCount, setSubBuildingCount] = useState<string>('');

  const emirates = [
    'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 
    'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'
  ];

  const locationTypes = [
    'Head Office', 'Branch Office', 'Manufacturing Facility',
    'Warehouse/Distribution Center', 'Retail Store', 'Hotel/Resort',
    'Construction Site', 'Educational Campus', 'Healthcare Facility', 'Other'
  ];

  const subBuildingFunctions = [
    'Administrative Offices', 'Manufacturing/Production', 'Storage/Warehouse',
    'Retail/Customer Service', 'Research & Development', 'Maintenance/Utilities',
    'Accommodation/Dormitory', 'Food Service/Kitchen', 'Meeting/Conference',
    'Laboratory/Testing', 'Server Room/IT', 'Recreation/Break Areas', 'Other'
  ];

  const utilityProviders: Record<string, string[]> = {
    'Dubai': ['DEWA'],
    'Abu Dhabi': ['ADWEA'],
    'Sharjah': ['SEWA'],
    'Ajman': ['FEWA'],
    'Ras Al Khaimah': ['FEWA'],
    'Fujairah': ['FEWA'],
    'Umm Al Quwain': ['FEWA']
  };

  const freeZones = [
    'JAFZA (Jebel Ali)', 'DMCC (Dubai Multi Commodities Centre)',
    'ADGM (Abu Dhabi Global Market)', 'RAKEZ (Ras Al Khaimah Economic Zone)',
    'Sharjah Airport International Free Zone', 'Fujairah Free Zone', 'Other'
  ];

  const allocationMethods = [
    'Floor Area Ratio', 'Employee Count Ratio', 'Usage Hours Ratio',
    'Revenue/Budget Allocation', 'Equal Split', 'Custom Allocation'
  ];

  // Usage benchmarks by sector (kWh/sqm/year for electricity, L/sqm/year for water)
  const usageBenchmarks: Record<string, Record<string, UsageBenchmark>> = {
    hospitality: {
      electricity: { efficient: 100, average: 150, inefficient: 200, unit: 'kWh/sqm/year' },
      water: { efficient: 300, average: 500, inefficient: 700, unit: 'L/sqm/year' }
    },
    manufacturing: {
      electricity: { efficient: 200, average: 300, inefficient: 400, unit: 'kWh/sqm/year' },
      water: { efficient: 100, average: 200, inefficient: 300, unit: 'L/sqm/year' }
    },
    healthcare: {
      electricity: { efficient: 150, average: 200, inefficient: 250, unit: 'kWh/sqm/year' },
      water: { efficient: 400, average: 600, inefficient: 800, unit: 'L/sqm/year' }
    },
    education: {
      electricity: { efficient: 80, average: 120, inefficient: 160, unit: 'kWh/sqm/year' },
      water: { efficient: 150, average: 250, inefficient: 350, unit: 'L/sqm/year' }
    },
    general: {
      electricity: { efficient: 100, average: 150, inefficient: 200, unit: 'kWh/sqm/year' },
      water: { efficient: 200, average: 300, inefficient: 400, unit: 'L/sqm/year' }
    }
  };

  // Get sector-specific utilities
  const getSectorUtilities = (sector: string, locationType: string): string[] => {
    const baseUtilities = ['electricity', 'water'];
    
    if (sector === 'hospitality' || locationType === 'Hotel/Resort') {
      return [...baseUtilities, 'districtCooling', 'lpg'];
    }
    if (sector === 'manufacturing' || locationType === 'Manufacturing Facility') {
      return [...baseUtilities, 'naturalGas', 'districtCooling'];
    }
    if (sector === 'healthcare' || locationType === 'Healthcare Facility') {
      return [...baseUtilities, 'naturalGas'];
    }
    
    return baseUtilities;
  };

  // Smart defaults generator
  const getSmartDefaults = (locationType: string, floorArea: number, employees: number) => {
    const defaults: any = {};
    
    // Auto-suggest building names
    if (locationType === 'Head Office') defaults.suggestedName = 'Head Office';
    else if (locationType === 'Manufacturing Facility') defaults.suggestedName = 'Production Facility';
    else if (locationType === 'Hotel/Resort') defaults.suggestedName = 'Main Hotel Building';
    
    // Estimate consumption based on benchmarks
    const sector = businessSector || 'general';
    const benchmarks = usageBenchmarks[sector] || usageBenchmarks.general;
    
    defaults.estimatedElectricity = Math.round(floorArea * (benchmarks.electricity.average / 12));
    defaults.estimatedWater = Math.round(floorArea * (benchmarks.water.average / 12));
    
    return defaults;
  };

  // Validate consumption against benchmarks
  const validateConsumption = (consumption: number, utility: string, sector: string, floorArea: number) => {
    const benchmarks = usageBenchmarks[sector] || usageBenchmarks.general;
    const benchmark = benchmarks[utility];
    
    if (!benchmark || !floorArea) return { status: 'unknown', color: '#9ca3af', message: '' };
    
    const annualConsumption = consumption * 12;
    const intensityPerSqm = annualConsumption / floorArea;
    
    if (intensityPerSqm <= benchmark.efficient) {
      return { 
        status: 'efficient', 
        color: '#10b981', 
        message: `Efficient usage (${Math.round(intensityPerSqm)} ${benchmark.unit})` 
      };
    } else if (intensityPerSqm <= benchmark.average) {
      return { 
        status: 'average', 
        color: '#f59e0b', 
        message: `Average usage (${Math.round(intensityPerSqm)} ${benchmark.unit})` 
      };
    } else {
      return { 
        status: 'inefficient', 
        color: '#ef4444', 
        message: `High usage (${Math.round(intensityPerSqm)} ${benchmark.unit}) - Consider efficiency improvements` 
      };
    }
  };

  // Comprehensive location validation
  const validateLocation = (location: LocationData): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required fields
    if (!location.name) errors.push('Location name is required');
    if (!location.emirate) errors.push('Emirate is required');
    if (!location.locationType) errors.push('Location type is required');
    if (!location.totalFloorArea) errors.push('Total floor area is required');
    if (!location.totalEmployees) errors.push('Number of employees is required');
    
    // Validate area/occupancy totals for sub-buildings
    if (location.hasSubBuildings && location.subBuildings.length > 0) {
      const totalSubArea = location.subBuildings.reduce((sum, sb) => sum + (sb.floorArea || 0), 0);
      const totalSubOccupancy = location.subBuildings.reduce((sum, sb) => sum + (sb.occupancy || 0), 0);
      
      if (totalSubArea > location.totalFloorArea) {
        warnings.push('Sub-building areas exceed main location area');
      }
      if (totalSubOccupancy > location.totalEmployees) {
        warnings.push('Sub-building occupancy exceeds main location employees');
      }
    }
    
    // Check utility percentage allocations for shared meters
    Object.entries(location.utilities).forEach(([utilityName, utility]) => {
      if (utility && !utility.separateMeter && utility.shared) {
        if (utility.shared.percentageUsage < 0 || utility.shared.percentageUsage > 100) {
          errors.push(`${utilityName} percentage must be between 0-100%`);
        }
      }
    });

    // Cross-validate shared meter percentages across sub-buildings
    if (location.hasSubBuildings && location.subBuildings.length > 0) {
      const sharedMeterValidation = validateSharedMeterPercentages(location);
      errors.push(...sharedMeterValidation.errors);
      warnings.push(...sharedMeterValidation.warnings);
    }
    
    return { errors, warnings, isValid: errors.length === 0 };
  };

  // Validate shared meter percentages across all buildings
  const validateSharedMeterPercentages = (location: LocationData) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const utilityTypes = ['electricity', 'water'] as const;
    
    utilityTypes.forEach(utilityType => {
      // Get all buildings (main + sub) with shared meters for this utility type
      const buildingsWithSharedMeters: Array<{
        name: string;
        percentage: number;
        isMain: boolean;
      }> = [];
      
      // Check main location
      const mainUtility = location.utilities[utilityType];
      if (mainUtility && !mainUtility.separateMeter && mainUtility.shared?.percentageUsage) {
        buildingsWithSharedMeters.push({
          name: location.name || 'Main Location',
          percentage: mainUtility.shared.percentageUsage,
          isMain: true
        });
      }
      
      // Check sub-buildings
      location.subBuildings.forEach((subBuilding, index) => {
        const subUtility = subBuilding.utilities[utilityType];
        if (subUtility && !subUtility.separateMeter && subUtility.shared?.percentageUsage) {
          buildingsWithSharedMeters.push({
            name: subBuilding.name || `Building ${index + 1}`,
            percentage: subUtility.shared.percentageUsage,
            isMain: false
          });
        }
      });
      
      // Validate total percentages
      if (buildingsWithSharedMeters.length > 1) {
        const totalPercentage = buildingsWithSharedMeters.reduce(
          (sum, building) => sum + building.percentage, 
          0
        );
        
        if (Math.abs(totalPercentage - 100) > 0.01) { // Allow small floating point differences
          const buildingNames = buildingsWithSharedMeters.map(b => b.name).join(', ');
          errors.push(
            `${utilityType} shared meter percentages total ${totalPercentage.toFixed(1)}% (should be 100%) across: ${buildingNames}`
          );
        }
        
        // Check for duplicate percentages that might indicate copy-paste errors
        const percentages = buildingsWithSharedMeters.map(b => b.percentage);
        const uniquePercentages = [...new Set(percentages)];
        if (percentages.length > uniquePercentages.length && uniquePercentages.length === 1) {
          warnings.push(
            `${utilityType} shared meter: All buildings have the same percentage (${uniquePercentages[0]}%). Verify allocation method.`
          );
        }
      }
    });
    
    return { errors, warnings };
  };

  // Auto-save functionality
  useEffect(() => {
    if (locations.length > 0) {
      const results = locations.map(validateLocation);
      setValidationResults(results);
    }
  }, [locations]);

  const getApplicableFrameworks = (emirate: string, locationType: string) => {
    const frameworks: string[] = [];
    
    if (emirate === 'Dubai') {
      frameworks.push('Dubai Municipality Regulations');
      if (['Hotel/Resort', 'Retail Store'].includes(locationType)) {
        frameworks.push('Dubai Sustainable Tourism');
      }
      frameworks.push('Al Sa\'fat Green Building');
    } else if (emirate === 'Abu Dhabi') {
      frameworks.push('Abu Dhabi Municipality Regulations');
      frameworks.push('Estidama Pearl Rating');
      if (locationType === 'Healthcare Facility') {
        frameworks.push('Department of Health Sustainability Goals');
      }
    } else {
      frameworks.push('Federal Regulations Only');
    }
    
    return frameworks;
  };

  const createNewLocation = (): LocationData => {
    const sectorUtilities = getSectorUtilities(businessSector, '');
    const utilities: any = {
      electricity: { separateMeter: false },
      water: { separateMeter: false }
    };
    
    if (sectorUtilities.includes('districtCooling')) {
      utilities.districtCooling = { separateMeter: false };
    }
    if (sectorUtilities.includes('naturalGas')) {
      utilities.naturalGas = { separateMeter: false };
    }
    if (sectorUtilities.includes('lpg')) {
      utilities.lpg = { separateMeter: false };
    }

    return {
      id: `loc_${Date.now()}`,
      name: '',
      address: '',
      emirate: '',
      locationType: '',
      totalFloorArea: 0,
      floorAreaUnit: 'sqm',
      totalEmployees: 0,
      hasSubBuildings: false,
      subBuildings: [],
      utilities,
      jurisdiction: {
        emirate: '',
        municipality: '',
        freeZone: null,
        applicableFrameworks: []
      },
      businessSector
    };
  };

  const createNewSubBuilding = (): SubBuildingData => ({
    id: `sub_${Date.now()}`,
    name: '',
    function: '',
    floorArea: 0,
    occupancy: 0,
    utilities: {
      electricity: { separateMeter: false },
      water: { separateMeter: false }
    }
  });

  const updateLocation = (index: number, updates: Partial<LocationData>) => {
    setLocations(prev => {
      const newLocations = [...prev];
      newLocations[index] = { ...newLocations[index], ...updates };
      
      // Auto-update jurisdiction when emirate changes
      if (updates.emirate) {
        newLocations[index].jurisdiction = {
          ...newLocations[index].jurisdiction,
          emirate: updates.emirate,
          municipality: updates.emirate === 'Dubai' ? 'Dubai Municipality' : 
                       updates.emirate === 'Abu Dhabi' ? 'Abu Dhabi Municipality' : 
                       `${updates.emirate} Municipality`,
          applicableFrameworks: getApplicableFrameworks(updates.emirate, newLocations[index].locationType)
        };
      }
      
      if (updates.locationType) {
        newLocations[index].jurisdiction.applicableFrameworks = 
          getApplicableFrameworks(newLocations[index].emirate, updates.locationType);
        
        // Auto-suggest smart defaults
        const smartDefaults = getSmartDefaults(
          updates.locationType, 
          newLocations[index].totalFloorArea, 
          newLocations[index].totalEmployees
        );
        
        if (smartDefaults.suggestedName && !newLocations[index].name) {
          newLocations[index].name = smartDefaults.suggestedName;
        }
      }
      
      return newLocations;
    });
  };

  const addSubBuilding = (locationIndex: number) => {
    const newSubBuilding = createNewSubBuilding();
    updateLocation(locationIndex, {
      subBuildings: [...locations[locationIndex].subBuildings, newSubBuilding]
    });
  };

  const updateSubBuilding = (locationIndex: number, subBuildingIndex: number, updates: Partial<SubBuildingData>) => {
    const location = locations[locationIndex];
    const newSubBuildings = [...location.subBuildings];
    newSubBuildings[subBuildingIndex] = { ...newSubBuildings[subBuildingIndex], ...updates };
    updateLocation(locationIndex, { subBuildings: newSubBuildings });
  };

  const validateCurrentStep = (): boolean => {
    if (currentStep === 0) return hasMultipleLocations !== null;
    if (currentStep === 1 && hasMultipleLocations) return locationCount !== '';
    if (currentStep === 2) {
      const currentLocation = locations[currentLocationIndex];
      if (!currentLocation) return false;
      
      if (currentSubStep === 0) {
        return !!(currentLocation.name && currentLocation.emirate && currentLocation.locationType);
      } else if (currentSubStep === 1 && currentLocation.hasSubBuildings) {
        return currentLocation.subBuildings.length > 0 && 
               currentLocation.subBuildings.every(sb => sb.name && sb.function);
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (hasMultipleLocations) {
        setCurrentStep(1);
      } else {
        setLocations([createNewLocation()]);
        setCurrentStep(2);
      }
    } else if (currentStep === 1) {
      const count = parseInt(locationCount);
      const actualCount = Math.min(count, 5); // Limit to 5 locations in wizard
      const newLocations = Array(actualCount).fill(null).map(() => createNewLocation());
      setLocations(newLocations);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const currentLocation = locations[currentLocationIndex];
      
      if (currentSubStep === 0) {
        if (currentLocation.hasSubBuildings) {
          setCurrentSubStep(1);
        } else {
          setCurrentSubStep(2);
        }
      } else if (currentSubStep === 1) {
        setCurrentSubStep(2);
      } else if (currentSubStep === 2) {
        if (currentLocationIndex < locations.length - 1) {
          setCurrentLocationIndex(currentLocationIndex + 1);
          setCurrentSubStep(0);
        } else {
          onComplete(locations);
        }
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 2 && currentSubStep > 0) {
      setCurrentSubStep(currentSubStep - 1);
    } else if (currentStep === 2 && currentLocationIndex > 0) {
      setCurrentLocationIndex(currentLocationIndex - 1);
      setCurrentSubStep(2);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const getSubStepProgress = () => {
    const currentLocation = locations[currentLocationIndex];
    if (!currentLocation) return { current: 0, total: 3, steps: [] };
    
    const steps = ['Basic Info'];
    if (currentLocation.hasSubBuildings) steps.push('Sub-Buildings');
    steps.push('Utilities');
    
    return { current: currentSubStep, total: steps.length, steps };
  };

  const styles = {
    container: {
      padding: '2rem',
      backgroundColor: '#111827',
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      marginBottom: '3rem',
      textAlign: 'center' as const
    },
    title: {
      fontSize: '3rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    subtitle: {
      fontSize: '1.5rem',
      color: '#9ca3af',
      marginBottom: '2rem'
    },
    stepIndicator: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      marginBottom: '3rem'
    },
    stepDot: {
      width: '3rem',
      height: '3rem',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '1.125rem'
    },
    stepActive: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    stepInactive: {
      backgroundColor: '#374151',
      color: '#9ca3af'
    },
    stepCompleted: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    card: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      marginBottom: '2rem',
      maxWidth: '800px',
      margin: '0 auto 2rem'
    },
    question: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '1.5rem',
      textAlign: 'center' as const
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      flexWrap: 'wrap' as const
    },
    button: {
      padding: '1rem 2rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '1rem',
      minWidth: '120px'
    },
    primaryButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#374151',
      color: 'white'
    },
    selectedButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    unselectedButton: {
      backgroundColor: '#374151',
      color: '#9ca3af'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '1rem',
      marginBottom: '1rem'
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '1rem',
      marginBottom: '1rem'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '500',
      color: '#e5e7eb'
    },
    locationCard: {
      backgroundColor: '#1f2937',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      marginBottom: '1rem'
    },
    locationHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    locationTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'white'
    },
    navigationButtons: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '3rem',
      maxWidth: '800px',
      margin: '3rem auto 0'
    },
    validationBox: {
      padding: '1rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
      fontSize: '0.875rem'
    },
    errorBox: {
      backgroundColor: '#fecaca',
      border: '1px solid #ef4444',
      color: '#991b1b'
    },
    warningBox: {
      backgroundColor: '#fef3c7',
      border: '1px solid #f59e0b',
      color: '#92400e'
    },
    successBox: {
      backgroundColor: '#d1fae5',
      border: '1px solid #10b981',
      color: '#065f46'
    }
  };

  // Continue implementing all render functions...
  const renderStepIndicator = () => {
    const steps = ['Location Assessment', 'Location Count', 'Location Details'];
    
    if (currentStep === 2) {
      const subStepProgress = getSubStepProgress();
      const locationProgress = `Location ${currentLocationIndex + 1}/${locations.length}`;
      const subStepNames = subStepProgress.steps;
      
      return (
        <div style={styles.stepIndicator}>
          <div style={{textAlign: 'center', marginBottom: '1rem', width: '100%'}}>
            <div style={{color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem'}}>
              {locationProgress} • Step {currentSubStep + 1} of {subStepProgress.total}
            </div>
            <div style={{display: 'flex', justifyContent: 'center', gap: '1rem'}}>
              {subStepNames.map((stepName, index) => (
                <div key={stepName} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <div style={{
                    ...styles.stepDot,
                    width: '2rem',
                    height: '2rem',
                    fontSize: '0.875rem',
                    ...(index === currentSubStep ? styles.stepActive : 
                        index < currentSubStep ? styles.stepCompleted : styles.stepInactive)
                  }}>
                    {index < currentSubStep ? '✓' : index + 1}
                  </div>
                  <span style={{
                    color: index <= currentSubStep ? '#10b981' : '#9ca3af',
                    fontWeight: '500',
                    fontSize: '0.75rem'
                  }}>
                    {stepName}
                  </span>
                  {index < subStepNames.length - 1 && 
                    <span style={{color: '#374151', margin: '0 0.5rem'}}>→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <div key={step} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <div style={{
              ...styles.stepDot,
              ...(index === currentStep ? styles.stepActive : 
                  index < currentStep ? styles.stepCompleted : styles.stepInactive)
            }}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span style={{
              color: index <= currentStep ? '#10b981' : '#9ca3af',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              {step}
            </span>
            {index < steps.length - 1 && <span style={{color: '#374151', margin: '0 1rem'}}>→</span>}
          </div>
        ))}
      </div>
    );
  };

  const renderMultipleLocationsQuestion = () => (
    <div style={styles.card}>
      <h2 style={styles.question}>
        🏢 Does your company operate from multiple locations or sites?
      </h2>
      <p style={{textAlign: 'center', color: '#9ca3af', marginBottom: '2rem'}}>
        This helps us understand your operational footprint for accurate ESG data collection
      </p>
      <div style={styles.buttonGroup}>
        <button
          onClick={() => setHasMultipleLocations(true)}
          style={{
            ...styles.button,
            ...(hasMultipleLocations === true ? styles.selectedButton : styles.unselectedButton)
          }}
        >
          Yes - Multiple Locations
        </button>
        <button
          onClick={() => setHasMultipleLocations(false)}
          style={{
            ...styles.button,
            ...(hasMultipleLocations === false ? styles.selectedButton : styles.unselectedButton)
          }}
        >
          No - Single Location
        </button>
      </div>
    </div>
  );

  const renderLocationCountQuestion = () => (
    <div style={styles.card}>
      <h2 style={styles.question}>
        📊 How many operational locations does your company have?
      </h2>
      <p style={{textAlign: 'center', color: '#9ca3af', marginBottom: '2rem'}}>
        Enter the exact number of locations (minimum 2, maximum 100)
      </p>
      <div style={{maxWidth: '300px', margin: '0 auto 2rem'}}>
        <input
          type="number"
          min="2"
          max="100"
          value={locationCount}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '' || (parseInt(value) >= 2 && parseInt(value) <= 100)) {
              setLocationCount(value);
            }
          }}
          placeholder="Enter number of locations"
          style={{
            ...styles.input, 
            textAlign: 'center', 
            fontSize: '1.5rem',
            marginBottom: 0
          }}
        />
      </div>
      
      {parseInt(locationCount) > 10 && (
        <div style={{
          ...styles.validationBox,
          backgroundColor: '#1e40af20',
          border: '1px solid #3b82f6',
          color: '#9ca3af',
          textAlign: 'center'
        }}>
          <strong style={{color: '#3b82f6'}}>💡 Bulk Import Available</strong>
          <p style={{margin: '0.5rem 0'}}>
            For companies with 10+ locations, we recommend using our Excel bulk import feature 
            after completing the wizard setup.
          </p>
          <p style={{margin: '0', fontSize: '0.75rem'}}>
            Complete this wizard with 3-5 representative locations to establish your data structure.
          </p>
        </div>
      )}
      
      {locationCount && parseInt(locationCount) > 25 && (
        <div style={{
          ...styles.validationBox,
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          color: '#92400e',
          textAlign: 'center',
          marginTop: '1rem'
        }}>
          <strong>⚠️ Large Implementation</strong>
          <p style={{margin: '0.5rem 0', fontSize: '0.875rem'}}>
            This wizard will configure only {Math.min(5, parseInt(locationCount))} representative locations. 
            Use bulk import for the remaining {parseInt(locationCount) - 5} locations.
          </p>
        </div>
      )}
    </div>
  );

  const renderLocationBasicInfo = () => {
    const currentLocation = locations[currentLocationIndex];
    if (!currentLocation) return null;
    
    const validation = validationResults[currentLocationIndex];

    return (
      <div style={styles.locationCard}>
        <div style={styles.locationHeader}>
          <h3 style={styles.locationTitle}>
            Location {currentLocationIndex + 1}: {currentLocation.name || 'Unnamed Location'}
          </h3>
        </div>

        {validation && (
          <div>
            {validation.errors.length > 0 && (
              <div style={{...styles.validationBox, ...styles.errorBox}}>
                <strong>⚠️ Required fields missing:</strong>
                <ul style={{margin: '0.5rem 0', paddingLeft: '1.5rem'}}>
                  {validation.errors.map((error, i) => <li key={i}>{error}</li>)}
                </ul>
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div style={{...styles.validationBox, ...styles.warningBox}}>
                <strong>⚠️ Warnings:</strong>
                <ul style={{margin: '0.5rem 0', paddingLeft: '1.5rem'}}>
                  {validation.warnings.map((warning, i) => <li key={i}>{warning}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <div style={styles.grid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Location Name *</label>
            <input
              type="text"
              value={currentLocation.name}
              onChange={(e) => updateLocation(currentLocationIndex, { name: e.target.value })}
              placeholder="e.g., Dubai Head Office"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Emirate *</label>
            <select
              value={currentLocation.emirate}
              onChange={(e) => updateLocation(currentLocationIndex, { emirate: e.target.value })}
              style={styles.select}
            >
              <option value="">Select Emirate</option>
              {emirates.map(emirate => (
                <option key={emirate} value={emirate}>{emirate}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Address</label>
            <input
              type="text"
              value={currentLocation.address}
              onChange={(e) => updateLocation(currentLocationIndex, { address: e.target.value })}
              placeholder="e.g., Sheikh Zayed Road, Dubai"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Location Type *</label>
            <select
              value={currentLocation.locationType}
              onChange={(e) => updateLocation(currentLocationIndex, { locationType: e.target.value })}
              style={styles.select}
            >
              <option value="">Select Type</option>
              {locationTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Total Floor Area *</label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <input
                type="number"
                value={currentLocation.totalFloorArea || ''}
                onChange={(e) => updateLocation(currentLocationIndex, { totalFloorArea: parseFloat(e.target.value) || 0 })}
                placeholder="2500"
                style={{...styles.input, flex: 1}}
              />
              <select
                value={currentLocation.floorAreaUnit}
                onChange={(e) => updateLocation(currentLocationIndex, { floorAreaUnit: e.target.value as 'sqm' | 'sqft' })}
                style={{...styles.select, width: '100px'}}
              >
                <option value="sqm">sqm</option>
                <option value="sqft">sqft</option>
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Number of Employees *</label>
            <input
              type="number"
              value={currentLocation.totalEmployees || ''}
              onChange={(e) => updateLocation(currentLocationIndex, { totalEmployees: parseInt(e.target.value) || 0 })}
              placeholder="150"
              style={styles.input}
            />
          </div>
        </div>

        {/* Building Structure Selection */}
        <div style={{marginTop: '2rem', padding: '1.5rem', backgroundColor: '#374151', borderRadius: '0.5rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h4 style={{fontSize: '1.25rem', fontWeight: '600', color: 'white'}}>
              🏗️ Building/Zone Structure
            </h4>
            <div style={{display: 'flex', gap: '1rem'}}>
              <button
                onClick={() => {
                  updateLocation(currentLocationIndex, { hasSubBuildings: true });
                  setSubBuildingCount('');
                }}
                style={{
                  ...styles.button,
                  fontSize: '0.875rem',
                  padding: '0.5rem 1rem',
                  ...(currentLocation.hasSubBuildings ? styles.selectedButton : styles.unselectedButton)
                }}
              >
                Multiple Buildings/Zones
              </button>
              <button
                onClick={() => {
                  updateLocation(currentLocationIndex, { hasSubBuildings: false, subBuildings: [] });
                  setSubBuildingCount('');
                }}
                style={{
                  ...styles.button,
                  fontSize: '0.875rem',
                  padding: '0.5rem 1rem',
                  ...(!currentLocation.hasSubBuildings ? styles.selectedButton : styles.unselectedButton)
                }}
              >
                Single Building
              </button>
            </div>
          </div>
          
          <p style={{color: '#9ca3af', fontSize: '0.875rem', marginBottom: currentLocation.hasSubBuildings ? '1rem' : 0}}>
            {currentLocation.hasSubBuildings 
              ? 'This location has multiple buildings, zones, or operational areas that need separate tracking.'
              : 'This location is a single building or operational area.'
            }
          </p>

          {/* Sub-Building Count Question */}
          {currentLocation.hasSubBuildings && (
            <div style={{marginTop: '1rem'}}>
              <label style={styles.label}>How many separate buildings/zones does this location have?</label>
              <div style={{maxWidth: '200px'}}>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={subBuildingCount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (parseInt(value) >= 2 && parseInt(value) <= 20)) {
                      setSubBuildingCount(value);
                      
                      // Auto-generate sub-buildings based on count
                      if (value && parseInt(value) >= 2) {
                        const count = parseInt(value);
                        const currentSubBuildings = currentLocation.subBuildings;
                        
                        if (count > currentSubBuildings.length) {
                          // Add more sub-buildings
                          const newSubBuildings = [...currentSubBuildings];
                          for (let i = currentSubBuildings.length; i < count; i++) {
                            newSubBuildings.push(createNewSubBuilding());
                          }
                          updateLocation(currentLocationIndex, { subBuildings: newSubBuildings });
                        } else if (count < currentSubBuildings.length) {
                          // Remove excess sub-buildings
                          updateLocation(currentLocationIndex, { 
                            subBuildings: currentSubBuildings.slice(0, count) 
                          });
                        }
                      }
                    }
                  }}
                  placeholder="e.g., 3"
                  style={{...styles.input, textAlign: 'center', marginBottom: 0}}
                />
              </div>
              
              {subBuildingCount && parseInt(subBuildingCount) > 10 && (
                <div style={{
                  ...styles.validationBox,
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  color: '#92400e',
                  fontSize: '0.75rem',
                  marginTop: '0.5rem'
                }}>
                  ⚠️ Large number of buildings. Consider grouping similar zones together for easier management.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Free Zone Information */}
        {currentLocation.emirate && (
          <div style={{marginTop: '2rem', padding: '1.5rem', backgroundColor: '#1e40af20', borderRadius: '0.5rem', border: '1px solid #3b82f6'}}>
            <h4 style={{fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#3b82f6'}}>
              🏛️ Regulatory Jurisdiction
            </h4>
            
            <div style={{marginBottom: '1rem'}}>
              <label style={styles.label}>Is this location within a free zone?</label>
              <select
                value={currentLocation.jurisdiction.freeZone || ''}
                onChange={(e) => updateLocation(currentLocationIndex, {
                  jurisdiction: { ...currentLocation.jurisdiction, freeZone: e.target.value || null }
                })}
                style={styles.select}
              >
                <option value="">No - Regular jurisdiction</option>
                {freeZones.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            <div style={{fontSize: '0.875rem', color: '#9ca3af', lineHeight: '1.5'}}>
              <strong>Applicable Frameworks:</strong>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem'}}>
                {currentLocation.jurisdiction.applicableFrameworks.map(framework => (
                  <span key={framework} style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem'
                  }}>
                    {framework}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSubBuildingsStep = () => {
    const currentLocation = locations[currentLocationIndex];
    if (!currentLocation || !currentLocation.hasSubBuildings) return null;

    const totalSubArea = currentLocation.subBuildings.reduce((sum, sb) => sum + (sb.floorArea || 0), 0);
    const totalSubOccupancy = currentLocation.subBuildings.reduce((sum, sb) => sum + (sb.occupancy || 0), 0);

    return (
      <div style={styles.locationCard}>
        <div style={styles.locationHeader}>
          <h3 style={styles.locationTitle}>
            Sub-Buildings for {currentLocation.name || 'Location'}
          </h3>
          <button
            onClick={() => addSubBuilding(currentLocationIndex)}
            style={{...styles.button, ...styles.primaryButton, fontSize: '0.875rem', padding: '0.5rem 1rem'}}
          >
            + Add Building/Zone
          </button>
        </div>

        <p style={{color: '#9ca3af', fontSize: '0.875rem', marginBottom: '2rem'}}>
          Configure separate buildings, zones, or operational areas within this location
        </p>

        {currentLocation.subBuildings.map((subBuilding, subIndex) => {
          const smartDefaults = getSmartDefaults(subBuilding.function, subBuilding.floorArea, subBuilding.occupancy);
          
          return (
            <div key={subBuilding.id} style={{
              backgroundColor: '#1f2937',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              border: '1px solid #4b5563'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <h5 style={{fontSize: '1rem', fontWeight: '600', color: 'white'}}>
                  Building/Zone {subIndex + 1}: {subBuilding.name || 'Unnamed'}
                </h5>
                <button
                  onClick={() => {
                    const newSubBuildings = currentLocation.subBuildings.filter((_, i) => i !== subIndex);
                    updateLocation(currentLocationIndex, { subBuildings: newSubBuildings });
                  }}
                  style={{
                    ...styles.button,
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem'
                  }}
                >
                  Remove
                </button>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Building/Zone Name *</label>
                  <input
                    type="text"
                    value={subBuilding.name}
                    onChange={(e) => updateSubBuilding(currentLocationIndex, subIndex, { name: e.target.value })}
                    placeholder={smartDefaults.suggestedName || "e.g., Main Office Tower"}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Function/Purpose *</label>
                  <select
                    value={subBuilding.function}
                    onChange={(e) => updateSubBuilding(currentLocationIndex, subIndex, { function: e.target.value })}
                    style={styles.select}
                  >
                    <option value="">Select Function</option>
                    {subBuildingFunctions.map(func => (
                      <option key={func} value={func}>{func}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Floor Area (sqm) *</label>
                  <input
                    type="number"
                    value={subBuilding.floorArea || ''}
                    onChange={(e) => updateSubBuilding(currentLocationIndex, subIndex, { floorArea: parseFloat(e.target.value) || 0 })}
                    placeholder="2000"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Occupancy (people) *</label>
                  <input
                    type="number"
                    value={subBuilding.occupancy || ''}
                    onChange={(e) => updateSubBuilding(currentLocationIndex, subIndex, { occupancy: parseInt(e.target.value) || 0 })}
                    placeholder="120"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Validation Summary */}
        <div style={{
          ...styles.validationBox,
          backgroundColor: totalSubArea > currentLocation.totalFloorArea ? '#fecaca' : '#d1fae5',
          border: `1px solid ${totalSubArea > currentLocation.totalFloorArea ? '#ef4444' : '#10b981'}`,
          color: totalSubArea > currentLocation.totalFloorArea ? '#991b1b' : '#065f46'
        }}>
          <strong>📊 Summary:</strong>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem'}}>
            <div>
              <div>Total sub-building area: {totalSubArea} sqm</div>
              <div>Main location area: {currentLocation.totalFloorArea} sqm</div>
              {totalSubArea > currentLocation.totalFloorArea && (
                <div style={{color: '#ef4444', fontWeight: 'bold'}}>⚠️ Areas exceed total</div>
              )}
            </div>
            <div>
              <div>Total sub-building occupancy: {totalSubOccupancy} people</div>
              <div>Main location employees: {currentLocation.totalEmployees} people</div>
              {totalSubOccupancy > currentLocation.totalEmployees && (
                <div style={{color: '#ef4444', fontWeight: 'bold'}}>⚠️ Occupancy exceeds total</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUtilitiesStep = () => {
    const currentLocation = locations[currentLocationIndex];
    if (!currentLocation) return null;

    const sectorUtilities = getSectorUtilities(businessSector, currentLocation.locationType);
    const utilityLabels: Record<string, string> = {
      electricity: '⚡ Electricity',
      water: '💧 Water',
      districtCooling: '❄️ District Cooling',
      naturalGas: '🔥 Natural Gas',
      lpg: '🍳 LPG (Liquefied Petroleum Gas)'
    };

    const renderUtilitySection = (utilityName: keyof typeof currentLocation.utilities, utility: UtilityData | undefined) => {
      if (!utility || !sectorUtilities.includes(utilityName)) return null;

      const validation = utility.monthlyAvgConsumption && currentLocation.totalFloorArea
        ? validateConsumption(utility.monthlyAvgConsumption, utilityName, businessSector, currentLocation.totalFloorArea)
        : null;

      return (
        <div key={utilityName} style={{
          backgroundColor: '#1f2937',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          border: '1px solid #4b5563'
        }}>
          <h5 style={{fontSize: '1.125rem', fontWeight: '600', color: 'white', marginBottom: '1rem'}}>
            {utilityLabels[utilityName]}
          </h5>

          {/* Meter Type Selection */}
          <div style={{marginBottom: '1rem'}}>
            <label style={styles.label}>Meter Configuration</label>
            <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
              <button
                onClick={() => updateLocation(currentLocationIndex, {
                  utilities: {
                    ...currentLocation.utilities,
                    [utilityName]: { ...utility, separateMeter: true }
                  }
                })}
                style={{
                  ...styles.button,
                  fontSize: '0.875rem',
                  padding: '0.5rem 1rem',
                  ...(utility.separateMeter ? styles.selectedButton : styles.unselectedButton)
                }}
              >
                Separate Meter
              </button>
              <button
                onClick={() => updateLocation(currentLocationIndex, {
                  utilities: {
                    ...currentLocation.utilities,
                    [utilityName]: { ...utility, separateMeter: false }
                  }
                })}
                style={{
                  ...styles.button,
                  fontSize: '0.875rem',
                  padding: '0.5rem 1rem',
                  ...(!utility.separateMeter ? styles.selectedButton : styles.unselectedButton)
                }}
              >
                Shared/No Meter
              </button>
            </div>
          </div>

          {/* Separate Meter Details */}
          {utility.separateMeter && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem'}}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Meter Number</label>
                <input
                  type="text"
                  value={utility.meterNumber || ''}
                  onChange={(e) => updateLocation(currentLocationIndex, {
                    utilities: {
                      ...currentLocation.utilities,
                      [utilityName]: { ...utility, meterNumber: e.target.value }
                    }
                  })}
                  placeholder="Enter meter number"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Utility Provider</label>
                <select
                  value={utility.provider || ''}
                  onChange={(e) => updateLocation(currentLocationIndex, {
                    utilities: {
                      ...currentLocation.utilities,
                      [utilityName]: { ...utility, provider: e.target.value }
                    }
                  })}
                  style={styles.select}
                >
                  <option value="">Select Provider</option>
                  {currentLocation.emirate && utilityProviders[currentLocation.emirate]?.map(provider => (
                    <option key={provider} value={provider}>{provider}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Shared Meter Configuration */}
          {!utility.separateMeter && (
            <div style={{marginBottom: '1rem'}}>
              <label style={styles.label}>Shared Meter Allocation</label>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minMax(200px, 1fr))', gap: '1rem'}}>
                <div style={styles.formGroup}>
                  <label style={{...styles.label, fontSize: '0.875rem'}}>Usage Percentage</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={utility.shared?.percentageUsage || ''}
                      onChange={(e) => updateLocation(currentLocationIndex, {
                        utilities: {
                          ...currentLocation.utilities,
                          [utilityName]: { 
                            ...utility, 
                            shared: { 
                              ...utility.shared,
                              percentageUsage: parseFloat(e.target.value) || 0,
                              sharedWith: utility.shared?.sharedWith || [],
                              allocationMethod: utility.shared?.allocationMethod || ''
                            }
                          }
                        }
                      })}
                      placeholder="50"
                      style={{...styles.input, marginBottom: 0, width: '80px'}}
                    />
                    <span style={{color: '#9ca3af'}}>%</span>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={{...styles.label, fontSize: '0.875rem'}}>Allocation Method</label>
                  <select
                    value={utility.shared?.allocationMethod || ''}
                    onChange={(e) => updateLocation(currentLocationIndex, {
                      utilities: {
                        ...currentLocation.utilities,
                        [utilityName]: { 
                          ...utility, 
                          shared: { 
                            ...utility.shared,
                            allocationMethod: e.target.value,
                            percentageUsage: utility.shared?.percentageUsage || 0,
                            sharedWith: utility.shared?.sharedWith || []
                          }
                        }
                      }
                    })}
                    style={{...styles.select, marginBottom: 0}}
                  >
                    <option value="">Select Method</option>
                    {allocationMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>

              {utility.shared?.percentageUsage && utility.shared.percentageUsage !== 100 && (
                <div style={{
                  ...styles.validationBox,
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  color: '#92400e',
                  fontSize: '0.75rem'
                }}>
                  ⚠️ Remaining {100 - utility.shared.percentageUsage}% allocated to other tenants/areas
                </div>
              )}

              {/* Cross-building percentage validation */}
              {currentLocation.hasSubBuildings && utility.shared?.percentageUsage && (() => {
                const sharedMeterValidation = validateSharedMeterPercentages(currentLocation);
                const utilityErrors = sharedMeterValidation.errors.filter(error => 
                  error.toLowerCase().includes(utilityName)
                );
                const utilityWarnings = sharedMeterValidation.warnings.filter(warning => 
                  warning.toLowerCase().includes(utilityName)
                );
                
                if (utilityErrors.length > 0 || utilityWarnings.length > 0) {
                  return (
                    <div style={{
                      ...styles.validationBox,
                      backgroundColor: utilityErrors.length > 0 ? '#fecaca' : '#fef3c7',
                      border: `1px solid ${utilityErrors.length > 0 ? '#ef4444' : '#f59e0b'}`,
                      color: utilityErrors.length > 0 ? '#991b1b' : '#92400e',
                      fontSize: '0.75rem',
                      marginTop: '0.5rem'
                    }}>
                      {utilityErrors.map((error, i) => (
                        <div key={i}>❌ {error}</div>
                      ))}
                      {utilityWarnings.map((warning, i) => (
                        <div key={i}>⚠️ {warning}</div>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Monthly Consumption Tracking */}
          <div style={{marginBottom: '1rem'}}>
            <label style={styles.label}>Monthly Consumption (Optional)</label>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
              <div style={styles.formGroup}>
                <label style={{...styles.label, fontSize: '0.875rem'}}>Average Monthly Usage</label>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <input
                    type="number"
                    value={utility.monthlyAvgConsumption || ''}
                    onChange={(e) => {
                      const consumption = parseFloat(e.target.value) || 0;
                      updateLocation(currentLocationIndex, {
                        utilities: {
                          ...currentLocation.utilities,
                          [utilityName]: { 
                            ...utility, 
                            monthlyAvgConsumption: consumption,
                            estimatedAnnual: consumption * 12,
                            unit: utilityName === 'electricity' ? 'kWh' : 
                                  utilityName === 'water' ? 'm³' : 
                                  utilityName === 'naturalGas' || utilityName === 'lpg' ? 'kg' : 'units'
                          }
                        }
                      });
                    }}
                    placeholder="5000"
                    style={{...styles.input, marginBottom: 0, flex: 1}}
                  />
                  <span style={{color: '#9ca3af', fontSize: '0.875rem'}}>
                    {utilityName === 'electricity' ? 'kWh' : 
                     utilityName === 'water' ? 'm³' : 
                     utilityName === 'naturalGas' || utilityName === 'lpg' ? 'kg' : 'units'}
                  </span>
                </div>
              </div>

              {utility.monthlyAvgConsumption && (
                <div style={styles.formGroup}>
                  <label style={{...styles.label, fontSize: '0.875rem'}}>Estimated Annual</label>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '0.5rem',
                    color: '#9ca3af',
                    fontSize: '0.875rem'
                  }}>
                    {(utility.monthlyAvgConsumption * 12).toLocaleString()} {utility.unit}/year
                  </div>
                </div>
              )}
            </div>

            {/* Usage Benchmark Validation */}
            {validation && (
              <div style={{
                ...styles.validationBox,
                backgroundColor: validation.status === 'efficient' ? '#d1fae5' : 
                                validation.status === 'average' ? '#fef3c7' : '#fecaca',
                border: `1px solid ${validation.color}`,
                color: validation.status === 'efficient' ? '#065f46' : 
                       validation.status === 'average' ? '#92400e' : '#991b1b'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span style={{fontSize: '1.2em'}}>
                    {validation.status === 'efficient' ? '🟢' : 
                     validation.status === 'average' ? '🟡' : '🔴'}
                  </span>
                  <span style={{fontWeight: 'bold'}}>{validation.message}</span>
                </div>
                {validation.status === 'inefficient' && (
                  <div style={{marginTop: '0.5rem', fontSize: '0.75rem'}}>
                    💡 Consider energy efficiency improvements, LED lighting, or equipment upgrades
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div style={styles.locationCard}>
        <div style={styles.locationHeader}>
          <h3 style={styles.locationTitle}>
            Utilities for {currentLocation.name || 'Location'}
          </h3>
        </div>

        <p style={{color: '#9ca3af', fontSize: '0.875rem', marginBottom: '2rem'}}>
          Configure utility metering and consumption tracking for {businessSector} sector compliance
        </p>

        {sectorUtilities.map(utilityName => 
          renderUtilitySection(
            utilityName as keyof typeof currentLocation.utilities, 
            currentLocation.utilities[utilityName as keyof typeof currentLocation.utilities]
          )
        )}

        {/* Sub-Building Utilities Summary */}
        {currentLocation.hasSubBuildings && currentLocation.subBuildings.length > 0 && (
          <div style={{
            backgroundColor: '#1e40af20',
            border: '1px solid #3b82f6',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginTop: '2rem'
          }}>
            <h5 style={{color: '#3b82f6', marginBottom: '1rem'}}>
              🏗️ Sub-Building Utility Summary
            </h5>
            <div style={{fontSize: '0.875rem', color: '#9ca3af'}}>
              {currentLocation.subBuildings.map((subBuilding, index) => (
                <div key={subBuilding.id} style={{marginBottom: '0.5rem'}}>
                  <strong>{subBuilding.name || `Building ${index + 1}`}:</strong>
                  {' '}Electricity: {subBuilding.utilities.electricity.separateMeter ? 'Separate' : 'Shared'},
                  {' '}Water: {subBuilding.utilities.water.separateMeter ? 'Separate' : 'Shared'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLocationDetails = () => {
    const currentLocation = locations[currentLocationIndex];
    if (!currentLocation) return null;

    return (
      <div>
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <h2 style={{fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem'}}>
            📍 Location Configuration
          </h2>
          <p style={{color: '#9ca3af'}}>
            Location {currentLocationIndex + 1} of {locations.length}
          </p>
        </div>

        {currentSubStep === 0 && renderLocationBasicInfo()}
        {currentSubStep === 1 && renderSubBuildingsStep()}
        {currentSubStep === 2 && renderUtilitiesStep()}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🏢 Locations & Facilities</h1>
        <p style={styles.subtitle}>
          Capture your operational footprint for accurate ESG data collection
        </p>
      </div>

      {renderStepIndicator()}

      {currentStep === 0 && renderMultipleLocationsQuestion()}
      {currentStep === 1 && renderLocationCountQuestion()}
      {currentStep === 2 && renderLocationDetails()}

      <div style={styles.navigationButtons}>
        <button
          onClick={handleBack}
          style={{...styles.button, ...styles.secondaryButton}}
        >
          ← Back
        </button>

        <div style={{display: 'flex', gap: '0.5rem'}}>
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                backgroundColor: i <= currentStep ? '#10b981' : '#374151'
              }}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={!validateCurrentStep()}
          style={{
            ...styles.button,
            ...styles.primaryButton,
            opacity: validateCurrentStep() ? 1 : 0.5
          }}
        >
          {currentStep === 2 && currentSubStep === 2 && currentLocationIndex === locations.length - 1 
            ? 'Complete Locations →' : 'Next →'}
        </button>
      </div>
    </div>
  );
};

export default LocationsStep;