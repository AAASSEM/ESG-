import React, { useState } from 'react';
import { DocumentArrowDownIcon, ChartBarIcon, EyeIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../utils/api';

interface ReportPreviewData {
  company: {
    name: string;
    sector: string;
    main_location: string;
  };
  statistics: {
    total_tasks: number;
    completion_rate: number;
    completed_tasks: number;
    overdue_tasks: number;
    category_breakdown: Record<string, any>;
    framework_coverage: Record<string, any>;
  };
  frameworks: string[];
  scoping_summary: {
    completed: boolean;
    completed_at: string;
    sector: string;
    total_answers: number;
  };
  task_counts_by_category: Record<string, number>;
  evidence_summary: {
    total_files: number;
    tasks_with_evidence: number;
  };
}

interface ReportGeneratorProps {
  companyId: string;
}

export default function ReportGenerator({ companyId }: ReportGeneratorProps) {
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch report preview data
  const { data: previewData, isLoading: previewLoading, error: previewError } = useQuery<ReportPreviewData>({
    queryKey: ['report-preview', companyId],
    queryFn: () => api.get(`/reports/companies/${companyId}/report/preview`).then(res => res.data),
    enabled: showPreview
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: () => {
      return api.get(`/reports/companies/${companyId}/report/esg?include_evidence=${includeEvidence}`, {
        responseType: 'blob'
      }).then(response => response.data);
    },
    onSuccess: (data) => {
      // Create download link
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const companyName = previewData?.company.name.replace(/\s+/g, '_') || 'Company';
      link.download = `ESG_Report_${companyName}_${timestamp}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  });

  const handleGenerateReport = () => {
    generateReportMutation.mutate();
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ESG Assessment Report</h2>
          <p className="text-gray-600">Generate comprehensive PDF reports for compliance and stakeholder communication</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
          >
            <EyeIcon className="w-5 h-5 mr-2" />
            {showPreview ? 'Hide Preview' : 'Preview Data'}
          </button>
        </div>
      </div>

      {/* Report Options */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Cog6ToothIcon className="w-5 h-5 mr-2" />
          Report Options
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="include-evidence"
              checked={includeEvidence}
              onChange={(e) => setIncludeEvidence(e.target.checked)}
              className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
            />
            <label htmlFor="include-evidence" className="ml-3 text-gray-700">
              Include evidence file listings in the report
            </label>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>📋 The report will include:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Executive summary with completion statistics</li>
              <li>Progress breakdown by ESG categories</li>
              <li>Framework coverage analysis</li>
              <li>Detailed task status and requirements</li>
              <li>ESG scoping wizard results</li>
              {includeEvidence && <li>Evidence file listings for each task</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Preview Data */}
      {showPreview && (
        <div className="bg-blue-50/60 backdrop-blur-sm rounded-xl p-6 mb-6 border border-blue-200/20">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Report Preview
          </h3>
          
          {previewLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-blue-600">Loading preview data...</span>
            </div>
          ) : previewError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              Unable to load preview data. Please try again.
            </div>
          ) : previewData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Company Info */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Company Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Name:</span> {previewData.company.name}</p>
                  <p><span className="text-gray-600">Sector:</span> {previewData.company.sector?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}</p>
                  <p><span className="text-gray-600">Location:</span> {previewData.company.main_location}</p>
                </div>
              </div>

              {/* Completion Stats */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Completion Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Overall Progress:</span>
                    <span className="font-medium text-teal-600">{previewData.statistics.completion_rate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed Tasks:</span>
                    <span className="font-medium">{previewData.statistics.completed_tasks} / {previewData.statistics.total_tasks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Overdue Tasks:</span>
                    <span className={`font-medium ${previewData.statistics.overdue_tasks > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {previewData.statistics.overdue_tasks}
                    </span>
                  </div>
                </div>
              </div>

              {/* Frameworks */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">ESG Frameworks</h4>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Applicable: {previewData.frameworks.length}</p>
                  {previewData.frameworks.slice(0, 3).map((framework, index) => (
                    <p key={index} className="text-xs text-gray-500 truncate">• {framework}</p>
                  ))}
                  {previewData.frameworks.length > 3 && (
                    <p className="text-xs text-gray-400">... and {previewData.frameworks.length - 3} more</p>
                  )}
                </div>
              </div>

              {/* Evidence Summary */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Evidence Files</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Total Files:</span> {previewData.evidence_summary.total_files}</p>
                  <p><span className="text-gray-600">Tasks with Evidence:</span> {previewData.evidence_summary.tasks_with_evidence}</p>
                </div>
              </div>

              {/* Scoping Status */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">ESG Scoping</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      previewData.scoping_summary.completed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {previewData.scoping_summary.completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                  {previewData.scoping_summary.completed && (
                    <p><span className="text-gray-600">Answers:</span> {previewData.scoping_summary.total_answers}</p>
                  )}
                </div>
              </div>

              {/* Task Categories */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Task Categories</h4>
                <div className="space-y-1 text-xs">
                  {Object.entries(previewData.task_counts_by_category).map(([category, count]) => (
                    <div key={category} className="flex justify-between">
                      <span className="text-gray-600">{category.replace('_', ' ')}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Generate Report Button */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerateReport}
          disabled={generateReportMutation.isPending}
          className="flex items-center px-8 py-4 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generateReportMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              Generating Report...
            </>
          ) : (
            <>
              <DocumentArrowDownIcon className="w-6 h-6 mr-3" />
              Generate PDF Report
            </>
          )}
        </button>
      </div>

      {/* Success/Error Messages */}
      {generateReportMutation.isSuccess && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          ✅ Report generated successfully! Your download should start automatically.
        </div>
      )}

      {generateReportMutation.error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ❌ Failed to generate report. Please try again or contact support if the issue persists.
        </div>
      )}

      {/* Report Information */}
      <div className="mt-6 bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">About ESG Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Report Contents</h4>
            <ul className="space-y-1">
              <li>• Executive summary with key metrics</li>
              <li>• Category-wise progress analysis</li>
              <li>• Framework compliance coverage</li>
              <li>• Detailed task breakdown</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Use Cases</h4>
            <ul className="space-y-1">
              <li>• Regulatory compliance submissions</li>
              <li>• Stakeholder communications</li>
              <li>• Internal progress tracking</li>
              <li>• Audit trail documentation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}