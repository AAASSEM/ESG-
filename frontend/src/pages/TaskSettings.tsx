import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function TaskSettings() {
  const { user } = useAuth();
  const [currentData, setCurrentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.company_id) {
      loadCurrentData();
    }
  }, [user]);

  const loadCurrentData = () => {
    try {
      const companyId = user?.company_id;
      if (!companyId) return;

      // Load current scoping data
      const savedAnswers = localStorage.getItem(`esg_scoping_answers_${companyId}`);
      const savedSector = localStorage.getItem(`business_sector_${companyId}`);
      const savedLocations = localStorage.getItem(`onboarding_locations_${companyId}`);

      setCurrentData({
        sector: savedSector || '',
        answers: savedAnswers ? JSON.parse(savedAnswers) : {},
        locations: savedLocations ? JSON.parse(savedLocations) : [],
        hasData: !!(savedAnswers && savedSector)
      });
    } catch (error) {
      console.error('Error loading current data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardStyles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: 'white',
      padding: '2rem'
    },
    card: {
      backgroundColor: '#1f2937',
      borderRadius: '0.75rem',
      padding: '2rem',
      marginBottom: '1.5rem',
      border: '1px solid #374151'
    },
    title: {
      fontSize: '1.875rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      color: 'white'
    },
    subtitle: {
      fontSize: '1rem',
      color: '#9ca3af',
      marginBottom: '2rem'
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    infoBox: {
      backgroundColor: '#374151',
      padding: '1rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem'
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    },
    statBox: {
      backgroundColor: '#374151',
      padding: '1rem',
      borderRadius: '0.5rem',
      textAlign: 'center' as const
    },
    statNumber: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#10b981'
    },
    statLabel: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    regenSection: {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      border: '2px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '0.75rem',
      padding: '2rem'
    }
  };

  if (loading) {
    return (
      <div style={dashboardStyles.container}>
        <div style={dashboardStyles.card}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⟳</div>
            <div>Loading task settings...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentData?.hasData) {
    return (
      <div style={dashboardStyles.container}>
        <div style={dashboardStyles.card}>
          <h1 style={dashboardStyles.title}>🔧 Task Settings</h1>
          <p style={dashboardStyles.subtitle}>
            Manage and regenerate your ESG compliance tasks
          </p>

          <div style={{
            backgroundColor: '#fbbf24',
            color: '#92400e',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
              ⚠️ No ESG Data Found
            </div>
            <div>
              You need to complete the ESG scoping wizard first before you can manage tasks.
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => window.location.href = '/onboarding'}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Start ESG Scoping Wizard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={dashboardStyles.container}>
      <div style={dashboardStyles.card}>
        <h1 style={dashboardStyles.title}>🔧 Task Settings</h1>
        <p style={dashboardStyles.subtitle}>
          Manage and regenerate your ESG compliance tasks based on your current data
        </p>

        {/* Current Data Overview */}
        <div style={dashboardStyles.statGrid}>
          <div style={dashboardStyles.statBox}>
            <div style={dashboardStyles.statNumber}>{currentData.sector || 'N/A'}</div>
            <div style={dashboardStyles.statLabel}>Business Sector</div>
          </div>
          <div style={dashboardStyles.statBox}>
            <div style={dashboardStyles.statNumber}>{Object.keys(currentData.answers).length}</div>
            <div style={dashboardStyles.statLabel}>ESG Questions Answered</div>
          </div>
          <div style={dashboardStyles.statBox}>
            <div style={dashboardStyles.statNumber}>{currentData.locations.length}</div>
            <div style={dashboardStyles.statLabel}>Locations Configured</div>
          </div>
          <div style={dashboardStyles.statBox}>
            <div style={dashboardStyles.statNumber}>
              {currentData.locations.reduce((total: number, loc: any) => total + (loc.meters?.length || 0), 0)}
            </div>
            <div style={dashboardStyles.statLabel}>Total Meters</div>
          </div>
        </div>

        {/* Current Scoping Summary */}
        <div style={dashboardStyles.card}>
          <h2 style={dashboardStyles.sectionTitle}>
            <span>📋</span>
            Current ESG Scoping Data
          </h2>

          <div style={dashboardStyles.infoBox}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Business Sector:</div>
            <div style={{ color: '#10b981' }}>{currentData.sector}</div>
          </div>

          <div style={dashboardStyles.infoBox}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Sample Answers:</div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              {Object.entries(currentData.answers).slice(0, 3).map(([key, value]: [string, any]) => (
                <div key={key} style={{ marginBottom: '0.25rem' }}>
                  Question {key}: {value}
                </div>
              ))}
              {Object.keys(currentData.answers).length > 3 && (
                <div>... and {Object.keys(currentData.answers).length - 3} more</div>
              )}
            </div>
          </div>

          {currentData.locations.length > 0 && (
            <div style={dashboardStyles.infoBox}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Locations:</div>
              <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                {currentData.locations.map((loc: any, index: number) => (
                  <div key={index} style={{ marginBottom: '0.25rem' }}>
                    {loc.name} ({loc.emirate}) - {loc.meters?.length || 0} meters
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Smart Task Regeneration Section */}
        <div style={dashboardStyles.regenSection}>
          <h2 style={dashboardStyles.sectionTitle}>
            <span>🔄</span>
            Smart Task Regeneration
          </h2>

          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
            Use this feature to regenerate your task list based on your current ESG scoping data. 
            The system will preserve completed tasks while updating or adding new ones based on 
            any changes to your answers or location data.
          </p>

          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: 'bold', 
              color: '#10b981',
              marginBottom: '0.5rem'
            }}>
              ✅ What gets preserved:
            </h3>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '1.5rem',
              color: '#9ca3af',
              fontSize: '0.875rem'
            }}>
              <li>All completed tasks remain untouched</li>
              <li>Progress on in-progress tasks is maintained</li>
              <li>Task evidence and comments are preserved</li>
            </ul>
          </div>

          <div style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: 'bold', 
              color: '#3b82f6',
              marginBottom: '0.5rem'
            }}>
              🔄 What gets updated:
            </h3>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '1.5rem',
              color: '#9ca3af',
              fontSize: '0.875rem'
            }}>
              <li>Tasks with updated meter information</li>
              <li>Tasks affected by changed ESG answers</li>
              <li>Due dates based on new urgency preferences</li>
              <li>New tasks for newly answered questions</li>
            </ul>
          </div>

          <div className="text-center text-gray-500 text-sm">
            Task regeneration feature has been simplified. 
            Use the main ESG Scoping wizard to update your tasks.
          </div>
        </div>
      </div>
    </div>
  );
}