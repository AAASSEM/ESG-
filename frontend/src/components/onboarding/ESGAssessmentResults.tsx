import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskStorage } from '../../services/taskStorage';

interface ESGAssessmentResultsProps {
  results: {
    sector: string;
    completedAt: string;
    overallESGScore: number;
    categoryScores: {
      environmental: number;
      social: number;
      governance: number;
    };
    totalTasksGenerated: number;
    highPriorityTasks: number;
    mediumPriorityTasks: number;
    lowPriorityTasks: number;
    complianceTasks: number;
    monitoringTasks: number;
    improvementTasks: number;
    regulatoryTasks: number;
    totalEstimatedHours: number;
    estimatedCompletionWeeks: number;
    complianceRate: number;
    frameworkCoverage: {
      totalFrameworks: number;
      activeFrameworks: string[];
      coveragePercentage: number;
    };
    carbonTrackingReadiness: {
      readinessScore: number;
      trackingCapabilities: number;
      recommendations: string[];
    };
    applicableFrameworks: string[];
    generatedTasks: any[];
  };
}

export default function ESGAssessmentResults({ results }: ESGAssessmentResultsProps) {
  const navigate = useNavigate();
  const [realTaskStats, setRealTaskStats] = useState(taskStorage.getTaskStats());

  // Debug logging with user-specific key
  console.log('ESGAssessmentResults received:', results);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const companyId = currentUser.company_id;
  const assessmentKey = companyId ? `assessmentResults_${companyId}` : 'assessmentResults';
  console.log('localStorage assessmentResults:', localStorage.getItem(assessmentKey));

  // Update task stats from real storage
  useEffect(() => {
    const updateStats = () => {
      setRealTaskStats(taskStorage.getTaskStats());
    };
    
    updateStats();
    
    // Listen for task updates
    const handleTasksUpdated = () => {
      updateStats();
    };
    
    window.addEventListener('tasksUpdated', handleTasksUpdated);
    
    return () => {
      window.removeEventListener('tasksUpdated', handleTasksUpdated);
    };
  }, []);

  // If no results provided, show error message instead of redirecting immediately
  if (!results || !results.sector) {
    return (
      <div style={{
        padding: '2rem',
        backgroundColor: '#111827',
        minHeight: '100vh',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: '#1f2937',
          padding: '3rem',
          borderRadius: '0.75rem',
          border: '1px solid #374151',
          textAlign: 'center',
          maxWidth: '28rem'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            No Assessment Results Found
          </h2>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
            It looks like you haven't completed an ESG assessment yet, or the results have expired.
          </p>
          <button
            onClick={() => navigate('/onboarding/wizard')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const dashboardStyles = {
    container: {
      padding: '2rem',
      backgroundColor: '#111827',
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '3rem',
      padding: '2rem',
      backgroundColor: '#1f2937',
      borderRadius: '0.75rem',
      border: '1px solid #374151'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      color: '#10b981'
    },
    subtitle: {
      fontSize: '1.125rem',
      color: '#9ca3af',
      marginBottom: '1rem'
    },
    completionBadge: {
      display: 'inline-block',
      padding: '0.5rem 1.5rem',
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      color: '#10b981',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    scoreSection: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '3rem'
    },
    scoreCard: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      textAlign: 'center' as const
    },
    scoreValue: {
      fontSize: '3rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    scoreLabel: {
      fontSize: '1rem',
      color: '#9ca3af',
      marginBottom: '0.5rem'
    },
    scoreDescription: {
      fontSize: '0.875rem',
      color: '#6b7280'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1.5rem',
      marginBottom: '3rem'
    },
    statCard: {
      backgroundColor: '#1f2937',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      textAlign: 'center' as const
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    statLabel: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    tasksSection: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      marginBottom: '3rem'
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '1.5rem',
      color: 'white'
    },
    taskBreakdown: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    },
    taskCard: {
      backgroundColor: '#374151',
      padding: '1rem',
      borderRadius: '0.5rem',
      textAlign: 'center' as const
    },
    frameworksSection: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      marginBottom: '3rem'
    },
    frameworkTags: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '0.5rem',
      marginBottom: '1rem'
    },
    frameworkTag: {
      padding: '0.25rem 0.75rem',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      color: '#3b82f6',
      borderRadius: '0.25rem',
      fontSize: '0.75rem'
    },
    nextStepsSection: {
      backgroundColor: '#1f2937',
      padding: '2rem',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      marginBottom: '3rem'
    },
    actionButtons: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      flexWrap: 'wrap' as const,
      marginTop: '2rem'
    },
    primaryButton: {
      padding: '0.75rem 2rem',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    secondaryButton: {
      padding: '0.75rem 2rem',
      backgroundColor: '#374151',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    recommendationsList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    recommendationItem: {
      padding: '0.75rem',
      backgroundColor: '#374151',
      borderRadius: '0.5rem',
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }
  };

  const downloadReport = () => {
    // Create a simple text report
    const reportContent = `
ESG Assessment Report
=====================

Company Sector: ${results.sector}
Assessment Date: ${new Date(results.completedAt).toLocaleDateString()}

OVERALL PERFORMANCE
==================
ESG Score: ${results.overallESGScore}/100 (${getScoreLabel(results.overallESGScore)})
Compliance Rate: ${results.complianceRate}%

CATEGORY SCORES
===============
Environmental: ${results.categoryScores.environmental}/100
Social: ${results.categoryScores.social}/100
Governance: ${results.categoryScores.governance}/100

TASK SUMMARY
============
Total Tasks Generated: ${results.totalTasksGenerated}
- High Priority: ${results.highPriorityTasks}
- Medium Priority: ${results.mediumPriorityTasks}
- Low Priority: ${results.lowPriorityTasks}

Task Types:
- Compliance Tasks: ${results.complianceTasks}
- Monitoring Tasks: ${results.monitoringTasks}
- Improvement Tasks: ${results.improvementTasks}
- Regulatory Tasks: ${results.regulatoryTasks}

IMPLEMENTATION PLAN
==================
Estimated Hours: ${results.totalEstimatedHours}
Estimated Completion: ${results.estimatedCompletionWeeks} weeks

FRAMEWORK COVERAGE
==================
Frameworks Covered: ${results.frameworkCoverage.activeFrameworks.length}/${results.frameworkCoverage.totalFrameworks}
Coverage Percentage: ${results.frameworkCoverage.coveragePercentage}%

Active Frameworks:
${results.frameworkCoverage.activeFrameworks.map(f => `- ${f}`).join('\n')}

CARBON TRACKING READINESS
=========================
Readiness Score: ${results.carbonTrackingReadiness.readinessScore}/100
Tracking Capabilities: ${results.carbonTrackingReadiness.trackingCapabilities}

${results.carbonTrackingReadiness.recommendations.length > 0 ? 
  `Recommendations:\n${results.carbonTrackingReadiness.recommendations.map(r => `- ${r}`).join('\n')}` : 
  'No additional recommendations at this time.'
}

Generated with ESG Dashboard - ${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ESG_Assessment_Report_${results.sector}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={dashboardStyles.container}>
      {/* Header */}
      <div style={dashboardStyles.header}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={dashboardStyles.title}>Assessment Complete!</h1>
        <p style={dashboardStyles.subtitle}>
          Your comprehensive ESG assessment for the {results.sector} sector is now complete
        </p>
        <div style={dashboardStyles.completionBadge}>
          Completed on {new Date(results.completedAt).toLocaleDateString()}
        </div>
      </div>

      {/* Overall Score Section */}
      <div style={dashboardStyles.scoreSection}>
        <div style={dashboardStyles.scoreCard}>
          <div style={{ 
            ...dashboardStyles.scoreValue, 
            color: getScoreColor(results.overallESGScore) 
          }}>
            {results.overallESGScore}
          </div>
          <div style={dashboardStyles.scoreLabel}>Overall ESG Score</div>
          <div style={dashboardStyles.scoreDescription}>
            {getScoreLabel(results.overallESGScore)}
          </div>
        </div>

        <div style={dashboardStyles.scoreCard}>
          <div style={{ 
            ...dashboardStyles.scoreValue, 
            color: getScoreColor(results.categoryScores.environmental) 
          }}>
            {results.categoryScores.environmental}
          </div>
          <div style={dashboardStyles.scoreLabel}>Environmental</div>
          <div style={dashboardStyles.scoreDescription}>
            Energy, Waste, Water
          </div>
        </div>

        <div style={dashboardStyles.scoreCard}>
          <div style={{ 
            ...dashboardStyles.scoreValue, 
            color: getScoreColor(results.categoryScores.social) 
          }}>
            {results.categoryScores.social}
          </div>
          <div style={dashboardStyles.scoreLabel}>Social</div>
          <div style={dashboardStyles.scoreDescription}>
            Training, Health, Community
          </div>
        </div>

        <div style={dashboardStyles.scoreCard}>
          <div style={{ 
            ...dashboardStyles.scoreValue, 
            color: getScoreColor(results.categoryScores.governance) 
          }}>
            {results.categoryScores.governance}
          </div>
          <div style={dashboardStyles.scoreLabel}>Governance</div>
          <div style={dashboardStyles.scoreDescription}>
            Policies, Management, Compliance
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={dashboardStyles.statsGrid}>
        <div style={dashboardStyles.statCard}>
          <div style={{ ...dashboardStyles.statValue, color: '#3b82f6' }}>
            {realTaskStats.total}
          </div>
          <div style={dashboardStyles.statLabel}>Total Tasks</div>
        </div>

        <div style={dashboardStyles.statCard}>
          <div style={{ ...dashboardStyles.statValue, color: '#ef4444' }}>
            {realTaskStats.high_priority}
          </div>
          <div style={dashboardStyles.statLabel}>High Priority</div>
        </div>

        <div style={dashboardStyles.statCard}>
          <div style={{ ...dashboardStyles.statValue, color: '#10b981' }}>
            {results.complianceRate}%
          </div>
          <div style={dashboardStyles.statLabel}>Compliance Rate</div>
        </div>

        <div style={dashboardStyles.statCard}>
          <div style={{ ...dashboardStyles.statValue, color: '#a855f7' }}>
            {results.estimatedCompletionWeeks}
          </div>
          <div style={dashboardStyles.statLabel}>Weeks to Complete</div>
        </div>
      </div>

      {/* Tasks Breakdown */}
      <div style={dashboardStyles.tasksSection}>
        <h2 style={dashboardStyles.sectionTitle}>📋 Generated Tasks Breakdown</h2>
        <div style={dashboardStyles.taskBreakdown}>
          <div style={dashboardStyles.taskCard}>
            <div style={{ ...dashboardStyles.statValue, color: '#ef4444' }}>
              {realTaskStats.todo}
            </div>
            <div style={dashboardStyles.statLabel}>To Do Tasks</div>
          </div>
          <div style={dashboardStyles.taskCard}>
            <div style={{ ...dashboardStyles.statValue, color: '#3b82f6' }}>
              {realTaskStats.in_progress}
            </div>
            <div style={dashboardStyles.statLabel}>In Progress</div>
          </div>
          <div style={dashboardStyles.taskCard}>
            <div style={{ ...dashboardStyles.statValue, color: '#10b981' }}>
              {realTaskStats.completed}
            </div>
            <div style={dashboardStyles.statLabel}>Completed</div>
          </div>
          <div style={dashboardStyles.taskCard}>
            <div style={{ ...dashboardStyles.statValue, color: '#f59e0b' }}>
              {realTaskStats.regulatory}
            </div>
            <div style={dashboardStyles.statLabel}>Regulatory Tasks</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          <p>Estimated Total Hours: <strong>{results.totalEstimatedHours}</strong></p>
        </div>
      </div>

      {/* Framework Coverage */}
      <div style={dashboardStyles.frameworksSection}>
        <h2 style={dashboardStyles.sectionTitle}>🏛️ Framework Coverage</h2>
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.125rem', color: '#10b981' }}>
            {results.frameworkCoverage.coveragePercentage}% Coverage
          </span>
          <span style={{ color: '#9ca3af', marginLeft: '1rem' }}>
            ({results.frameworkCoverage.activeFrameworks.length}/{results.frameworkCoverage.totalFrameworks} frameworks)
          </span>
        </div>
        <div style={dashboardStyles.frameworkTags}>
          {results.frameworkCoverage.activeFrameworks.map((framework, index) => (
            <span key={index} style={dashboardStyles.frameworkTag}>
              {framework}
            </span>
          ))}
        </div>
      </div>

      {/* Carbon Tracking Readiness */}
      {results.carbonTrackingReadiness.readinessScore < 100 && (
        <div style={dashboardStyles.frameworksSection}>
          <h2 style={dashboardStyles.sectionTitle}>🌱 Carbon Tracking Readiness</h2>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ 
              fontSize: '1.125rem', 
              color: getScoreColor(results.carbonTrackingReadiness.readinessScore) 
            }}>
              {results.carbonTrackingReadiness.readinessScore}/100
            </span>
            <span style={{ color: '#9ca3af', marginLeft: '1rem' }}>
              ({results.carbonTrackingReadiness.trackingCapabilities} tracking capabilities active)
            </span>
          </div>
          {results.carbonTrackingReadiness.recommendations.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
                Recommendations:
              </h3>
              <ul style={dashboardStyles.recommendationsList}>
                {results.carbonTrackingReadiness.recommendations.map((rec, index) => (
                  <li key={index} style={dashboardStyles.recommendationItem}>
                    <span style={{ color: '#f59e0b' }}>⚠️</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Next Steps */}
      <div style={dashboardStyles.nextStepsSection}>
        <h2 style={dashboardStyles.sectionTitle}>🚀 Next Steps</h2>
        <div style={{ marginBottom: '2rem' }}>
          <div style={dashboardStyles.recommendationItem}>
            <span style={{ color: '#10b981' }}>✅</span>
            <span><strong>Start with High Priority Tasks</strong> - Focus on the {realTaskStats.high_priority} high-priority tasks first</span>
          </div>
          <div style={dashboardStyles.recommendationItem}>
            <span style={{ color: '#3b82f6' }}>📊</span>
            <span><strong>Set Up Monitoring</strong> - Implement ongoing monitoring tasks for compliance</span>
          </div>
          <div style={dashboardStyles.recommendationItem}>
            <span style={{ color: '#f59e0b' }}>📋</span>
            <span><strong>Address Regulatory Requirements</strong> - Complete {realTaskStats.regulatory} regulatory tasks for compliance</span>
          </div>
          <div style={dashboardStyles.recommendationItem}>
            <span style={{ color: '#a855f7' }}>⏰</span>
            <span><strong>Plan Timeline</strong> - Allocate {results.estimatedCompletionWeeks} weeks for full implementation</span>
          </div>
        </div>

        <div style={dashboardStyles.actionButtons}>
          <button 
            style={dashboardStyles.primaryButton}
            onClick={() => navigate('/tasks')}
          >
            <span>📋</span>
            <span>View My Tasks</span>
          </button>
          <button 
            style={dashboardStyles.secondaryButton}
            onClick={downloadReport}
          >
            <span>📄</span>
            <span>Download Report</span>
          </button>
          <button 
            style={dashboardStyles.secondaryButton}
            onClick={() => navigate('/dashboard')}
          >
            <span>🏠</span>
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}