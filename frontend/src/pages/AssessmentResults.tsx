import React from 'react';
import ESGAssessmentResults from '../components/onboarding/ESGAssessmentResults';

export default function AssessmentResults() {
  // Get results from localStorage using user-specific key
  const getResults = () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = currentUser.company_id;
      const assessmentKey = companyId ? `assessmentResults_${companyId}` : 'assessmentResults';
      const stored = localStorage.getItem(assessmentKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error parsing assessment results:', error);
      return {};
    }
  };

  return <ESGAssessmentResults results={getResults()} />;
}