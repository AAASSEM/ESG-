// Location Storage Service - manages locations in localStorage
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
  };
  jurisdiction: {
    emirate: string;
    municipality: string;
    freeZone: string | null;
    applicableFrameworks: string[];
  };
  createdAt: string;
  updatedAt: string;
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

interface UtilityData {
  separateMeter: boolean;
  meterNumber?: string;
  provider?: string;
  monthlyAvgConsumption?: number;
  unit?: string;
  shared?: {
    sharedWith: string[];
    percentageUsage: number;
    allocationMethod: string;
  };
}

class LocationStorageService {
  private storageKey = 'esg_locations';

  // Get all locations
  getLocations(): LocationData[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading locations:', error);
      return [];
    }
  }

  // Save locations
  saveLocations(locations: LocationData[]): void {
    try {
      const locationsWithTimestamps = locations.map(location => ({
        ...location,
        updatedAt: new Date().toISOString()
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(locationsWithTimestamps));
    } catch (error) {
      console.error('Error saving locations:', error);
    }
  }

  // Add or update locations (for onboarding completion)
  setLocations(locations: Omit<LocationData, 'createdAt' | 'updatedAt'>[]): LocationData[] {
    const timestamp = new Date().toISOString();
    const locationsWithTimestamps: LocationData[] = locations.map(location => ({
      ...location,
      createdAt: timestamp,
      updatedAt: timestamp
    }));
    
    this.saveLocations(locationsWithTimestamps);
    return locationsWithTimestamps;
  }

  // Update a single location
  updateLocation(locationId: string, updates: Partial<LocationData>): void {
    const locations = this.getLocations();
    const locationIndex = locations.findIndex(l => l.id === locationId);
    
    if (locationIndex >= 0) {
      locations[locationIndex] = { 
        ...locations[locationIndex], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveLocations(locations);
    }
  }

  // Add a new location
  addLocation(location: Omit<LocationData, 'id' | 'createdAt' | 'updatedAt'>): LocationData {
    const locations = this.getLocations();
    const timestamp = new Date().toISOString();
    const newLocation: LocationData = {
      ...location,
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    locations.push(newLocation);
    this.saveLocations(locations);
    return newLocation;
  }

  // Delete a location
  deleteLocation(locationId: string): void {
    const locations = this.getLocations();
    const filteredLocations = locations.filter(l => l.id !== locationId);
    this.saveLocations(filteredLocations);
  }

  // Get location by ID
  getLocationById(locationId: string): LocationData | undefined {
    const locations = this.getLocations();
    return locations.find(l => l.id === locationId);
  }

  // Clear all locations (for testing)
  clearAllLocations(): void {
    localStorage.removeItem(this.storageKey);
  }

  // Get locations by emirate
  getLocationsByEmirate(emirate: string): LocationData[] {
    const locations = this.getLocations();
    return locations.filter(l => l.emirate === emirate);
  }

  // Get locations by type
  getLocationsByType(locationType: string): LocationData[] {
    const locations = this.getLocations();
    return locations.filter(l => l.locationType === locationType);
  }

  // Get location statistics
  getLocationStats() {
    const locations = this.getLocations();
    
    const totalLocations = locations.length;
    const totalFloorArea = locations.reduce((sum, l) => sum + l.totalFloorArea, 0);
    const totalEmployees = locations.reduce((sum, l) => sum + l.totalEmployees, 0);
    const totalSubBuildings = locations.reduce((sum, l) => sum + l.subBuildings.length, 0);
    
    const emiratesCount = locations.reduce((acc, l) => {
      acc[l.emirate] = (acc[l.emirate] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const locationTypesCount = locations.reduce((acc, l) => {
      acc[l.locationType] = (acc[l.locationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const utilityStats = {
      separateElectricityMeters: locations.filter(l => l.utilities.electricity.separateMeter).length,
      separateWaterMeters: locations.filter(l => l.utilities.water.separateMeter).length,
      freeZoneLocations: locations.filter(l => l.jurisdiction.freeZone).length
    };
    
    return {
      totalLocations,
      totalFloorArea,
      totalEmployees,
      totalSubBuildings,
      averageFloorAreaPerLocation: totalLocations > 0 ? Math.round(totalFloorArea / totalLocations) : 0,
      averageEmployeesPerLocation: totalLocations > 0 ? Math.round(totalEmployees / totalLocations) : 0,
      emiratesCount,
      locationTypesCount,
      utilityStats,
      hasMultipleLocations: totalLocations > 1,
      hasSubBuildings: totalSubBuildings > 0
    };
  }

  // Get applicable frameworks for all locations
  getAllApplicableFrameworks(): string[] {
    const locations = this.getLocations();
    const allFrameworks = locations.flatMap(l => l.jurisdiction.applicableFrameworks);
    return [...new Set(allFrameworks)]; // Remove duplicates
  }

  // Get utility providers used
  getUtilityProviders(): { electricity: string[], water: string[] } {
    const locations = this.getLocations();
    const electricityProviders: string[] = [];
    const waterProviders: string[] = [];
    
    locations.forEach(location => {
      if (location.utilities.electricity.provider) {
        electricityProviders.push(location.utilities.electricity.provider);
      }
      if (location.utilities.water.provider) {
        waterProviders.push(location.utilities.water.provider);
      }
      
      // Check sub-buildings too
      location.subBuildings.forEach(subBuilding => {
        if (subBuilding.utilities.electricity.provider) {
          electricityProviders.push(subBuilding.utilities.electricity.provider);
        }
        if (subBuilding.utilities.water.provider) {
          waterProviders.push(subBuilding.utilities.water.provider);
        }
      });
    });
    
    return {
      electricity: [...new Set(electricityProviders)],
      water: [...new Set(waterProviders)]
    };
  }

  // Validate location data
  validateLocation(location: LocationData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields
    if (!location.name.trim()) errors.push('Location name is required');
    if (!location.emirate) errors.push('Emirate is required');
    if (!location.locationType) errors.push('Location type is required');
    if (location.totalFloorArea <= 0) errors.push('Total floor area must be greater than 0');
    if (location.totalEmployees <= 0) errors.push('Number of employees must be greater than 0');
    
    // Sub-building validation
    if (location.hasSubBuildings && location.subBuildings.length > 0) {
      const totalSubBuildingArea = location.subBuildings.reduce((sum, sb) => sum + (sb.floorArea || 0), 0);
      const totalSubBuildingOccupancy = location.subBuildings.reduce((sum, sb) => sum + (sb.occupancy || 0), 0);
      
      if (totalSubBuildingArea > location.totalFloorArea) {
        errors.push('Total sub-building area cannot exceed main location area');
      }
      
      if (totalSubBuildingOccupancy > location.totalEmployees) {
        errors.push('Total sub-building occupancy cannot exceed main location employees');
      }
      
      // Check individual sub-buildings
      location.subBuildings.forEach((subBuilding, index) => {
        if (!subBuilding.name.trim()) {
          errors.push(`Sub-building ${index + 1} name is required`);
        }
        if (!subBuilding.function) {
          errors.push(`Sub-building ${index + 1} function is required`);
        }
        if (subBuilding.floorArea <= 0) {
          errors.push(`Sub-building ${index + 1} floor area must be greater than 0`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get locations summary for dashboard
  getLocationsSummary() {
    const stats = this.getLocationStats();
    const locations = this.getLocations();
    
    return {
      ...stats,
      primaryLocation: locations.find(l => l.locationType === 'Head Office') || locations[0],
      recentlyUpdated: locations
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3)
    };
  }
}

// Export singleton instance
export const locationStorage = new LocationStorageService();
export type { LocationData, SubBuildingData, UtilityData };