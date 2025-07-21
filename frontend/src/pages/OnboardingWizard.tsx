import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LocationsStep from '../components/onboarding/LocationsStep';
import ESGScopingWizard from '../components/onboarding/ESGScopingWizard';
import { locationStorage, type LocationData } from '../services/locationStorage';

interface BusinessData {
  companyName: string;
  businessSector: string;
  companySize: string;
  primaryEmirate: string;
  registrationNumber: string;
  website: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { company } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [businessData, setBusinessData] = useState<BusinessData>({
    companyName: company?.name || '',
    businessSector: company?.business_sector || '',
    companySize: '',
    primaryEmirate: company?.main_location || '',
    registrationNumber: '',
    website: company?.website || '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: ''
  });

  // Update business data when company changes (e.g., new login)
  useEffect(() => {
    if (company) {
      setBusinessData(prev => ({
        ...prev,
        companyName: company.name || '',
        businessSector: company.business_sector || '',
        primaryEmirate: company.main_location || '',
        website: company.website || ''
      }));
    }
  }, [company]);

  // Load existing business data when component mounts
  useEffect(() => {
    const loadExistingBusinessData = () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const companyId = currentUser.company_id;
        
        if (companyId) {
          const savedBusinessData = localStorage.getItem(`onboarding_business_data_${companyId}`);
          if (savedBusinessData) {
            const parsedData = JSON.parse(savedBusinessData);
            console.log('Loading saved business data from localStorage for company:', companyId, parsedData);
            setBusinessData(prev => ({
              ...prev,
              ...parsedData,
              // Don't override company data that comes from authentication
              companyName: company?.name || parsedData.companyName || '',
              businessSector: company?.business_sector || parsedData.businessSector || '',
              primaryEmirate: company?.main_location || parsedData.primaryEmirate || '',
              website: company?.website || parsedData.website || ''
            }));
          }
        }
      } catch (error) {
        console.error('Error loading existing business data:', error);
      }
    };
    
    loadExistingBusinessData();
  }, [company]);

  // Save business data to localStorage whenever it changes
  useEffect(() => {
    // Only save if there's meaningful data beyond the initial values
    const hasValidData = businessData.companySize !== '' || 
                        businessData.registrationNumber !== '' ||
                        businessData.contactPerson !== '' ||
                        businessData.contactEmail !== '' ||
                        businessData.contactPhone !== '';
    
    if (hasValidData) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = currentUser.company_id;
      if (companyId) {
        localStorage.setItem(`onboarding_business_data_${companyId}`, JSON.stringify(businessData));
        console.log('Saved business data to localStorage for company:', companyId, businessData);
      }
    }
  }, [businessData]);
  const [locationData, setLocationData] = useState<LocationData[]>([]);

  const steps = [
    { id: 'business', title: 'Additional Information', icon: '🏢', description: 'Company size & details' },
    { id: 'locations', title: 'Locations & Facilities', icon: '📍', description: 'Sites & infrastructure' },
    { id: 'esg-scoping', title: 'ESG Assessment', icon: '🌱', description: 'Sustainability scoping' },
    { id: 'complete', title: 'Complete Setup', icon: '✅', description: 'Review & finalize' }
  ];

  const businessSectors = [
    'Hospitality', 'Construction', 'Manufacturing', 'Logistics',
    'Education', 'Healthcare', 'Real Estate', 'Retail', 'Other'
  ];

  const companySizes = [
    '1-10 employees', '11-50 employees', '51-200 employees', 
    '201-500 employees', '500+ employees'
  ];

  const emirates = [
    'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 
    'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'
  ];

  const handleBusinessDataChange = (field: keyof BusinessData, value: string) => {
    setBusinessData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationDataComplete = async (locations: LocationData[]) => {
    console.log('Locations completed:', locations);
    
    try {
      // Save locations to backend
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = currentUser.company_id;
      
      if (companyId) {
        console.log('Saving locations to backend for company:', companyId);
        
        const response = await fetch(`http://localhost:8000/api/companies/${companyId}/locations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(locations)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Locations saved to backend successfully:', result);
        } else {
          console.error('Failed to save locations to backend:', response.status);
        }
      }
    } catch (error) {
      console.error('Error saving locations to backend:', error);
    }
    
    // Save locations to legacy storage for compatibility
    locationStorage.setLocations(locations);
    setLocationData(locations);
    setCurrentStep(2); // Move to ESG Scoping
  };

  const handleESGComplete = (results: any) => {
    console.log('ESG Assessment completed:', results);
    setCurrentStep(3); // Move to completion
  };

  const validateBusinessStep = (): boolean => {
    return businessData.companySize !== '';
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (validateBusinessStep()) {
        setCurrentStep(1); // Move to Locations
      }
    } else if (currentStep === 3) {
      // Complete onboarding
      localStorage.setItem('onboardingCompleted', 'true');
      localStorage.setItem('businessData', JSON.stringify(businessData));
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getProgressPercentage = () => {
    return ((currentStep + 1) / steps.length) * 100;
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
      textAlign: 'center' as const,
      marginBottom: '3rem'
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
    progressContainer: {
      maxWidth: '800px',
      margin: '0 auto 3rem',
      padding: '2rem',
      backgroundColor: '#1f2937',
      borderRadius: '0.75rem',
      border: '1px solid #374151'
    },
    progressSteps: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '2rem',
      flexWrap: 'wrap' as const,
      gap: '1rem'
    },
    step: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      flex: 1,
      minWidth: '150px'
    },
    stepIcon: {
      width: '3rem',
      height: '3rem',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      marginBottom: '0.5rem'
    },
    stepActive: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    stepCompleted: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    stepInactive: {
      backgroundColor: '#374151',
      color: '#9ca3af'
    },
    stepTitle: {
      fontSize: '0.875rem',
      fontWeight: '600',
      marginBottom: '0.25rem',
      textAlign: 'center' as const
    },
    stepDescription: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      textAlign: 'center' as const
    },
    progressBar: {
      width: '100%',
      height: '0.5rem',
      backgroundColor: '#374151',
      borderRadius: '0.25rem',
      overflow: 'hidden',
      marginBottom: '1rem'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#10b981',
      borderRadius: '0.25rem',
      transition: 'width 0.3s ease'
    },
    progressText: {
      textAlign: 'center' as const,
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    card: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      marginBottom: '2rem',
      maxWidth: '800px',
      margin: '0 auto'
    },
    formGrid: {
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
    input: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '1rem',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#374151',
      border: '1px solid #4b5563',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: '1rem',
      boxSizing: 'border-box'
    },
    navigationButtons: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '3rem',
      maxWidth: '800px',
      margin: '3rem auto 0'
    },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    primaryButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#374151',
      color: 'white'
    },
    completionCard: {
      backgroundColor: '#1f2937',
      padding: '3rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      maxWidth: '600px',
      margin: '0 auto',
      textAlign: 'center' as const
    },
    completionIcon: {
      fontSize: '4rem',
      marginBottom: '1.5rem'
    },
    completionTitle: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '1rem'
    },
    completionText: {
      fontSize: '1.125rem',
      color: '#9ca3af',
      marginBottom: '2rem',
      lineHeight: '1.6'
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    },
    summaryItem: {
      backgroundColor: '#374151',
      padding: '1rem',
      borderRadius: '0.5rem',
      textAlign: 'center' as const
    },
    summaryValue: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#10b981',
      marginBottom: '0.25rem'
    },
    summaryLabel: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    }
  };

  const renderBusinessInfoStep = () => (
    <div style={styles.card}>
      <h2 style={{fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center'}}>
        🏢 Additional Information
      </h2>
      <p style={{textAlign: 'center', color: '#9ca3af', marginBottom: '2rem'}}>
        Complete your company profile with additional details
      </p>
      
      {/* Display existing company information */}
      <div style={{
        backgroundColor: '#374151',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        marginBottom: '2rem',
        border: '1px solid #4b5563',
        gridColumn: '1 / -1'
      }}>
        <h3 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#10b981'}}>
          ✅ Company Information (Already Provided)
        </h3>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Company Name</label>
            <div style={{
              ...styles.input,
              backgroundColor: '#4b5563',
              color: '#d1d5db',
              cursor: 'not-allowed'
            }}>
              {businessData.companyName}
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Business Sector</label>
            <div style={{
              ...styles.input,
              backgroundColor: '#4b5563',
              color: '#d1d5db',
              cursor: 'not-allowed'
            }}>
              {businessData.businessSector}
            </div>
          </div>
        </div>
      </div>
      
      <div style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Company Size *</label>
          <select
            value={businessData.companySize}
            onChange={(e) => handleBusinessDataChange('companySize', e.target.value)}
            style={styles.select}
          >
            <option value="">Select company size</option>
            {companySizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Registration Number</label>
          <input
            type="text"
            value={businessData.registrationNumber}
            onChange={(e) => handleBusinessDataChange('registrationNumber', e.target.value)}
            placeholder="Trade license number"
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Website</label>
          <input
            type="url"
            value={businessData.website}
            onChange={(e) => handleBusinessDataChange('website', e.target.value)}
            placeholder="https://www.example.com"
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Contact Person</label>
          <input
            type="text"
            value={businessData.contactPerson}
            onChange={(e) => handleBusinessDataChange('contactPerson', e.target.value)}
            placeholder="Primary contact name"
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Contact Email</label>
          <input
            type="email"
            value={businessData.contactEmail}
            onChange={(e) => handleBusinessDataChange('contactEmail', e.target.value)}
            placeholder="contact@company.com"
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Contact Phone</label>
          <input
            type="tel"
            value={businessData.contactPhone}
            onChange={(e) => handleBusinessDataChange('contactPhone', e.target.value)}
            placeholder="+971 50 123 4567"
            style={styles.input}
          />
        </div>
      </div>
    </div>
  );

  const renderCompletionStep = () => {
    const locationStats = locationStorage.getLocationStats();
    // Get total tasks from user-specific assessment results
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const companyId = currentUser.company_id;
    const assessmentKey = companyId ? `assessmentResults_${companyId}` : 'assessmentResults';
    const totalTasks = JSON.parse(localStorage.getItem(assessmentKey) || '{}').totalTasksGenerated || 0;

    return (
      <div style={styles.completionCard}>
        <div style={styles.completionIcon}>🎉</div>
        <h2 style={styles.completionTitle}>Setup Complete!</h2>
        <p style={styles.completionText}>
          Congratulations! Your ESG platform is now configured and ready to use. 
          We've generated a comprehensive compliance roadmap tailored to your business.
        </p>

        <div style={styles.summaryGrid}>
          <div style={styles.summaryItem}>
            <div style={styles.summaryValue}>{businessData.businessSector}</div>
            <div style={styles.summaryLabel}>Business Sector</div>
          </div>
          <div style={styles.summaryItem}>
            <div style={styles.summaryValue}>{locationStats.totalLocations}</div>
            <div style={styles.summaryLabel}>Locations</div>
          </div>
          <div style={styles.summaryItem}>
            <div style={styles.summaryValue}>{totalTasks}</div>
            <div style={styles.summaryLabel}>Tasks Generated</div>
          </div>
          <div style={styles.summaryItem}>
            <div style={styles.summaryValue}>{locationStats.totalEmployees}</div>
            <div style={styles.summaryLabel}>Total Employees</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#1e40af20',
          border: '1px solid #3b82f6',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <h4 style={{fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#3b82f6'}}>
            🚀 What's Next?
          </h4>
          <ul style={{margin: 0, paddingLeft: '1.5rem', color: '#9ca3af', lineHeight: '1.6'}}>
            <li>Review your personalized ESG tasks in the Task Management section</li>
            <li>Start uploading evidence for high-priority compliance requirements</li>
            <li>Monitor your progress on the Dashboard</li>
            <li>Generate reports when you're ready for compliance audits</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>ESG Platform Setup</h1>
        <p style={styles.subtitle}>Configure your sustainability compliance journey</p>
      </div>

      {/* Progress Indicator */}
      <div style={styles.progressContainer}>
        <div style={styles.progressSteps}>
          {steps.map((step, index) => (
            <div key={step.id} style={styles.step}>
              <div style={{
                ...styles.stepIcon,
                ...(index === currentStep ? styles.stepActive :
                    index < currentStep ? styles.stepCompleted : styles.stepInactive)
              }}>
                {index < currentStep ? '✓' : step.icon}
              </div>
              <div style={{
                ...styles.stepTitle,
                color: index <= currentStep ? '#10b981' : '#9ca3af'
              }}>
                {step.title}
              </div>
              <div style={styles.stepDescription}>
                {step.description}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: `${getProgressPercentage()}%`}}></div>
        </div>
        <div style={styles.progressText}>
          Step {currentStep + 1} of {steps.length} ({Math.round(getProgressPercentage())}% complete)
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 0 && renderBusinessInfoStep()}
      {currentStep === 1 && (
        <LocationsStep
          onComplete={handleLocationDataComplete}
          onBack={handleBack}
          initialData={locationData}
        />
      )}
      {currentStep === 2 && (
        <ESGScopingWizard
          companyId={company?.id || "temp"}
          businessSector={company?.business_sector || businessData.businessSector}
          onComplete={handleESGComplete}
          onBack={handleBack}
        />
      )}
      {currentStep === 3 && renderCompletionStep()}

      {/* Navigation Buttons */}
      {currentStep !== 1 && currentStep !== 2 && (
        <div style={styles.navigationButtons}>
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            style={{
              ...styles.button,
              ...styles.secondaryButton,
              opacity: currentStep === 0 ? 0.5 : 1
            }}
          >
            ← Back
          </button>

          <div style={{display: 'flex', gap: '0.5rem'}}>
            {Array.from({ length: steps.length }, (_, i) => (
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
            disabled={currentStep === 0 && !validateBusinessStep()}
            style={{
              ...styles.button,
              ...styles.primaryButton,
              opacity: (currentStep === 0 && !validateBusinessStep()) ? 0.5 : 1
            }}
          >
            {currentStep === 3 ? 'Go to Dashboard' : 'Next'} →
          </button>
        </div>
      )}
    </div>
  );
};

export default OnboardingWizard;