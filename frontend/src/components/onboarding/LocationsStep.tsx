import React, { useState, useEffect } from 'react';

interface MeterData {
  id: string;
  type: 'electricity' | 'water' | 'gas' | 'other';
  description: string;
  meterNumber?: string;
  provider?: string;
}

interface LocationData {
  id: string;
  name: string;
  address: string;
  emirate: string;
  totalFloorArea: number;
  numberOfFloors: number;
  buildingType: string;
  ownershipType: string;
  meters: MeterData[];
}

interface SimplifiedLocationsStepProps {
  onComplete: (locationData: LocationData[]) => void;
  onBack: () => void;
  initialData?: LocationData[];
}

const SimplifiedLocationsStep: React.FC<SimplifiedLocationsStepProps> = ({ 
  onComplete, 
  onBack, 
  initialData = [] 
}) => {
  function createNewLocation(): LocationData {
    return {
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      address: '',
      emirate: '',
      totalFloorArea: 0,
      numberOfFloors: 1,
      buildingType: '',
      ownershipType: '',
      meters: []
    };
  }

  const [locations, setLocations] = useState<LocationData[]>(
    initialData.length > 0 ? initialData : [createNewLocation()]
  );

  // Load existing locations data when component mounts
  useEffect(() => {
    const loadExistingLocations = async () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const companyId = currentUser.company_id;
        
        if (companyId) {
          console.log('Loading existing locations for company:', companyId);
          
          // Try to get existing locations from backend
          const response = await fetch(`http://localhost:8000/api/companies/${companyId}/locations`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const locationData = await response.json();
            console.log('Existing locations from backend:', locationData);
            
            if (locationData.locations && locationData.locations.length > 0) {
              setLocations(locationData.locations);
            } else {
              // Fallback to localStorage with user-specific key
              const savedLocations = localStorage.getItem(`onboarding_locations_${companyId}`);
              if (savedLocations) {
                const parsedLocations = JSON.parse(savedLocations);
                console.log('Loading saved locations from localStorage:', parsedLocations);
                setLocations(parsedLocations.length > 0 ? parsedLocations : [createNewLocation()]);
              }
            }
          } else {
            // Fallback to localStorage if backend fails with user-specific key
            const savedLocations = localStorage.getItem(`onboarding_locations_${companyId}`);
            if (savedLocations) {
              const parsedLocations = JSON.parse(savedLocations);
              console.log('Loading saved locations from localStorage fallback:', parsedLocations);
              setLocations(parsedLocations.length > 0 ? parsedLocations : [createNewLocation()]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading existing locations:', error);
        // Fallback to localStorage with user-specific key
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const companyId = currentUser.company_id;
        if (companyId) {
          const savedLocations = localStorage.getItem(`onboarding_locations_${companyId}`);
          if (savedLocations) {
            const parsedLocations = JSON.parse(savedLocations);
            console.log('Loading saved locations from localStorage after error:', parsedLocations);
            setLocations(parsedLocations.length > 0 ? parsedLocations : [createNewLocation()]);
          }
        }
      }
    };
    
    // Only load if we don't have initial data
    if (initialData.length === 0) {
      loadExistingLocations();
    }
  }, [initialData]);

  // Save locations to localStorage whenever they change
  useEffect(() => {
    // Only save if locations have meaningful data
    const hasValidData = locations.some(loc => loc.name.trim() !== '' || loc.address.trim() !== '');
    if (hasValidData) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = currentUser.company_id;
      if (companyId) {
        localStorage.setItem(`onboarding_locations_${companyId}`, JSON.stringify(locations));
        console.log('Saved locations to localStorage for company:', companyId, locations);
      }
    }
  }, [locations]);

  const emirates = [
    'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 
    'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'
  ];

  const buildingTypes = [
    'Office Building', 'Warehouse', 'Manufacturing Facility', 
    'Retail Store', 'Hotel', 'Hospital', 'School', 'Mixed Use', 'Other'
  ];

  const ownershipTypes = [
    'Owned', 'Leased', 'Rented', 'Partnership', 'Other'
  ];

  const meterTypes = [
    { value: 'electricity', label: '⚡ Electricity', color: '#f59e0b' },
    { value: 'water', label: '💧 Water', color: '#3b82f6' },
    { value: 'gas', label: '🔥 Gas', color: '#ef4444' },
    { value: 'other', label: '📊 Other', color: '#8b5cf6' }
  ];

  function createNewMeter(): MeterData {
    return {
      id: `meter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'electricity',
      description: '',
      meterNumber: '',
      provider: ''
    };
  }

  const updateLocation = (locationIndex: number, updates: Partial<LocationData>) => {
    setLocations(prev => {
      const newLocations = [...prev];
      newLocations[locationIndex] = { ...newLocations[locationIndex], ...updates };
      return newLocations;
    });
  };

  const addLocation = () => {
    setLocations(prev => [...prev, createNewLocation()]);
  };

  const removeLocation = (locationIndex: number) => {
    if (locations.length > 1) {
      setLocations(prev => prev.filter((_, index) => index !== locationIndex));
    }
  };

  const addMeter = (locationIndex: number) => {
    const newMeter = createNewMeter();
    updateLocation(locationIndex, {
      meters: [...locations[locationIndex].meters, newMeter]
    });
  };

  const updateMeter = (locationIndex: number, meterIndex: number, updates: Partial<MeterData>) => {
    const location = locations[locationIndex];
    const newMeters = [...location.meters];
    newMeters[meterIndex] = { ...newMeters[meterIndex], ...updates };
    updateLocation(locationIndex, { meters: newMeters });
  };

  const removeMeter = (locationIndex: number, meterIndex: number) => {
    const location = locations[locationIndex];
    const newMeters = location.meters.filter((_, index) => index !== meterIndex);
    updateLocation(locationIndex, { meters: newMeters });
  };

  const validateForm = (): boolean => {
    return locations.every(location => 
      location.name.trim() !== '' && 
      location.address.trim() !== '' &&
      location.emirate !== '' &&
      location.totalFloorArea > 0 &&
      location.buildingType !== '' &&
      location.ownershipType !== ''
    );
  };

  const handleComplete = () => {
    if (validateForm()) {
      onComplete(locations);
    }
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
      fontSize: '2.5rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    subtitle: {
      fontSize: '1.125rem',
      color: '#9ca3af',
      marginBottom: '2rem'
    },
    card: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '1rem',
      border: '1px solid #374151',
      marginBottom: '2rem',
      maxWidth: '900px',
      margin: '0 auto 2rem'
    },
    locationCard: {
      backgroundColor: '#1f2937',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      marginBottom: '1.5rem'
    },
    locationHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      paddingBottom: '0.75rem',
      borderBottom: '1px solid #374151'
    },
    locationTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'white'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem'
    },
    gridFull: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '1rem',
      marginBottom: '1.5rem'
    },
    formGroup: {
      marginBottom: '0'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '500',
      color: '#e5e7eb',
      fontSize: '0.875rem'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '0.875rem',
      boxSizing: 'border-box' as const
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '0.875rem',
      minHeight: '80px',
      resize: 'vertical' as const,
      boxSizing: 'border-box' as const
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '0.875rem',
      boxSizing: 'border-box' as const
    },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '0.875rem',
      transition: 'all 0.2s'
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#374151',
      color: 'white',
      border: '1px solid #4b5563'
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    addButton: {
      backgroundColor: '#10b981',
      color: 'white',
      padding: '0.5rem 1rem',
      fontSize: '0.75rem'
    },
    metersSection: {
      marginTop: '1.5rem',
      padding: '1rem',
      backgroundColor: '#374151',
      borderRadius: '0.5rem'
    },
    meterCard: {
      backgroundColor: '#1f2937',
      padding: '1rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
      border: '1px solid #4b5563'
    },
    meterHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    meterTypeChip: {
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    navigationButtons: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '3rem',
      maxWidth: '900px',
      margin: '3rem auto 0'
    },
    validationError: {
      backgroundColor: '#fecaca',
      border: '1px solid #ef4444',
      color: '#991b1b',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      marginBottom: '1rem'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📍 Business Locations</h1>
        <p style={styles.subtitle}>
          Add details about your business locations and facilities
        </p>
      </div>

      <div style={styles.card}>
        {locations.map((location, locationIndex) => (
          <div key={location.id} style={styles.locationCard}>
            <div style={styles.locationHeader}>
              <h3 style={styles.locationTitle}>
                {location.name || `Location ${locationIndex + 1}`}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {locations.length > 1 && (
                  <button
                    onClick={() => removeLocation(locationIndex)}
                    style={{ ...styles.button, ...styles.dangerButton }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Basic Location Information */}
            <div style={styles.grid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Location Name *</label>
                <input
                  type="text"
                  value={location.name}
                  onChange={(e) => updateLocation(locationIndex, { name: e.target.value })}
                  placeholder="e.g., Dubai Head Office"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Emirate *</label>
                <select
                  value={location.emirate}
                  onChange={(e) => updateLocation(locationIndex, { emirate: e.target.value })}
                  style={styles.select}
                >
                  <option value="">Select Emirate</option>
                  {emirates.map(emirate => (
                    <option key={emirate} value={emirate}>{emirate}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Total Floor Area (sq ft) *</label>
                <input
                  type="number"
                  value={location.totalFloorArea || ''}
                  onChange={(e) => updateLocation(locationIndex, { totalFloorArea: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 5000"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Number of Floors *</label>
                <input
                  type="number"
                  value={location.numberOfFloors || ''}
                  onChange={(e) => updateLocation(locationIndex, { numberOfFloors: parseInt(e.target.value) || 1 })}
                  placeholder="e.g., 3"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Building Type *</label>
                <select
                  value={location.buildingType}
                  onChange={(e) => updateLocation(locationIndex, { buildingType: e.target.value })}
                  style={styles.select}
                >
                  <option value="">Select building type</option>
                  {buildingTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Ownership Type *</label>
                <select
                  value={location.ownershipType}
                  onChange={(e) => updateLocation(locationIndex, { ownershipType: e.target.value })}
                  style={styles.select}
                >
                  <option value="">Select ownership</option>
                  {ownershipTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address */}
            <div style={styles.gridFull}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Primary Location Address *</label>
                <textarea
                  value={location.address}
                  onChange={(e) => updateLocation(locationIndex, { address: e.target.value })}
                  placeholder="Enter your primary business address"
                  style={styles.textarea}
                />
              </div>
            </div>

            {/* Meters Section */}
            <div style={styles.metersSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'white', margin: 0 }}>
                  📊 Utility Meters
                </h4>
                <button
                  onClick={() => addMeter(locationIndex)}
                  style={{ ...styles.button, ...styles.addButton }}
                >
                  + Add Meter
                </button>
              </div>

              {location.meters.length === 0 && (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', margin: '2rem 0' }}>
                  No meters added yet. Click "Add Meter" to add utility meters for this location.
                </p>
              )}

              {location.meters.map((meter, meterIndex) => {
                const meterTypeInfo = meterTypes.find(type => type.value === meter.type);
                
                return (
                  <div key={meter.id} style={styles.meterCard}>
                    <div style={styles.meterHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span 
                          style={{
                            ...styles.meterTypeChip,
                            backgroundColor: meterTypeInfo?.color || '#8b5cf6',
                            color: 'white'
                          }}
                        >
                          {meterTypeInfo?.label || 'Unknown'}
                        </span>
                        <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                          Meter {meterIndex + 1}
                        </span>
                      </div>
                      <button
                        onClick={() => removeMeter(locationIndex, meterIndex)}
                        style={{ 
                          ...styles.button, 
                          ...styles.dangerButton,
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem'
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <div style={styles.grid}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Meter Type</label>
                        <select
                          value={meter.type}
                          onChange={(e) => updateMeter(locationIndex, meterIndex, { 
                            type: e.target.value as 'electricity' | 'water' | 'gas' | 'other' 
                          })}
                          style={styles.select}
                        >
                          {meterTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.label}>Meter Number</label>
                        <input
                          type="text"
                          value={meter.meterNumber || ''}
                          onChange={(e) => updateMeter(locationIndex, meterIndex, { meterNumber: e.target.value })}
                          placeholder="e.g., ELC001234"
                          style={styles.input}
                        />
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.label}>Utility Provider</label>
                        <input
                          type="text"
                          value={meter.provider || ''}
                          onChange={(e) => updateMeter(locationIndex, meterIndex, { provider: e.target.value })}
                          placeholder="e.g., DEWA, ADWEA"
                          style={styles.input}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <label style={styles.label}>Meter Description</label>
                      <textarea
                        value={meter.description}
                        onChange={(e) => updateMeter(locationIndex, meterIndex, { description: e.target.value })}
                        placeholder="Describe what this meter measures (e.g., Main building electricity, Office floor water supply, Kitchen gas meter)"
                        style={{ ...styles.textarea, minHeight: '60px' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Add Another Location */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={addLocation}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            + Add Another Location
          </button>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            For multi-site businesses
          </p>
        </div>

        {/* Validation */}
        {!validateForm() && (
          <div style={styles.validationError}>
            ⚠️ Please fill in all required fields (marked with *) for all locations before proceeding.
          </div>
        )}

      </div>

      {/* Navigation */}
      <div style={styles.navigationButtons}>
        <button
          onClick={onBack}
          style={{ ...styles.button, ...styles.secondaryButton }}
        >
          ← Previous
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
            {locations.length} location{locations.length !== 1 ? 's' : ''} configured
          </div>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
            {locations.reduce((total, loc) => total + loc.meters.length, 0)} total meters
          </div>
        </div>

        <button
          onClick={handleComplete}
          disabled={!validateForm()}
          style={{
            ...styles.button,
            ...styles.primaryButton,
            opacity: validateForm() ? 1 : 0.6,
            cursor: validateForm() ? 'pointer' : 'not-allowed'
          }}
        >
          Next Step →
        </button>
      </div>
    </div>
  );
};

export default SimplifiedLocationsStep;