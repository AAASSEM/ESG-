import React from 'react';
import ESGAssessmentResults from '../components/onboarding/ESGAssessmentResults';

export default function AssessmentResults() {
  // Get results from localStorage
  const getResults = () => {
    try {
      const stored = localStorage.getItem('assessmentResults');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error parsing assessment results:', error);
      return {};
    }
  };

  return <ESGAssessmentResults results={getResults()} />;
}