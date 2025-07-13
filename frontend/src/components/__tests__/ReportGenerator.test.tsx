import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReportGenerator from '../reports/ReportGenerator';

// Mock the API module
jest.mock('../../utils/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  DocumentArrowDownIcon: () => <div data-testid="document-icon" />,
  ChartBarIcon: () => <div data-testid="chart-icon" />,
  EyeIcon: () => <div data-testid="eye-icon" />,
  Cog6ToothIcon: () => <div data-testid="cog-icon" />,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ReportGenerator', () => {
  const mockCompanyId = 'test-company-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders report generator component', () => {
    renderWithQueryClient(<ReportGenerator companyId={mockCompanyId} />);
    
    expect(screen.getByText('ESG Assessment Report')).toBeInTheDocument();
    expect(screen.getByText('Generate comprehensive PDF reports for compliance and stakeholder communication')).toBeInTheDocument();
  });

  test('shows preview toggle button', () => {
    renderWithQueryClient(<ReportGenerator companyId={mockCompanyId} />);
    
    expect(screen.getByText('Preview Data')).toBeInTheDocument();
  });

  test('displays report options section', () => {
    renderWithQueryClient(<ReportGenerator companyId={mockCompanyId} />);
    
    expect(screen.getByText('Report Options')).toBeInTheDocument();
    expect(screen.getByLabelText('Include evidence file listings in the report')).toBeInTheDocument();
  });

  test('evidence checkbox is checked by default', () => {
    renderWithQueryClient(<ReportGenerator companyId={mockCompanyId} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  test('can toggle evidence checkbox', () => {
    renderWithQueryClient(<ReportGenerator companyId={mockCompanyId} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  test('shows generate report button', () => {
    renderWithQueryClient(<ReportGenerator companyId={mockCompanyId} />);
    
    expect(screen.getByText('Generate PDF Report')).toBeInTheDocument();
  });

  test('displays report information section', () => {
    renderWithQueryClient(<ReportGenerator companyId={mockCompanyId} />);
    
    expect(screen.getByText('About ESG Reports')).toBeInTheDocument();
    expect(screen.getByText('Report Contents')).toBeInTheDocument();
    expect(screen.getByText('Use Cases')).toBeInTheDocument();
  });

  test('lists expected report contents', () => {
    renderWithQueryClient(<ReportGenerator companyId={mockCompanyId} />);
    
    expect(screen.getByText('• Executive summary with key metrics')).toBeInTheDocument();
    expect(screen.getByText('• Category-wise progress analysis')).toBeInTheDocument();
    expect(screen.getByText('• Framework compliance coverage')).toBeInTheDocument();
    expect(screen.getByText('• Detailed task breakdown')).toBeInTheDocument();
  });

  test('lists expected use cases', () => {
    renderWithQueryClient(<ReportGenerator companyId={mockCompanyId} />);
    
    expect(screen.getByText('• Regulatory compliance submissions')).toBeInTheDocument();
    expect(screen.getByText('• Stakeholder communications')).toBeInTheDocument();
    expect(screen.getByText('• Internal progress tracking')).toBeInTheDocument();
    expect(screen.getByText('• Audit trail documentation')).toBeInTheDocument();
  });

  test('toggle preview shows/hides preview section', async () => {
    const { api } = require('../../utils/api');
    api.get.mockResolvedValue({
      data: {
        company: { name: 'Test Company', sector: 'hospitality', main_location: 'Dubai' },
        statistics: { completion_rate: 75.5, total_tasks: 10, completed_tasks: 8, overdue_tasks: 0 },
        frameworks: ['Green Key Global'],
        scoping_summary: { completed: true, total_answers: 15 },
        task_counts_by_category: { energy: 3, water: 2 },
        evidence_summary: { total_files: 5, tasks_with_evidence: 8 }
      }
    });

    renderWithQueryClient(<ReportGenerator companyId={mockCompanyId} />);
    
    // Initially no preview should be shown
    expect(screen.queryByText('Report Preview')).not.toBeInTheDocument();
    
    // Click preview button
    const previewButton = screen.getByText('Preview Data');
    fireEvent.click(previewButton);
    
    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText('Report Preview')).toBeInTheDocument();
    });
    
    // Should show company information
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('Hospitality')).toBeInTheDocument();
    expect(screen.getByText('Dubai')).toBeInTheDocument();
  });
});

describe('ReportGenerator API Integration', () => {
  const mockCompanyId = 'test-company-id';

  test('handles preview data loading error', async () => {
    const { api } = require('../../utils/api');
    api.get.mockRejectedValue(new Error('Failed to load'));

    renderWithQueryClient(<ReportGenerator companyId={mockCompanyId} />);
    
    // Click preview button
    const previewButton = screen.getByText('Preview Data');
    fireEvent.click(previewButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Unable to load preview data. Please try again.')).toBeInTheDocument();
    });
  });

  test('handles report generation success', async () => {
    const { api } = require('../../utils/api');
    const mockBlob = new Blob(['fake pdf content'], { type: 'application/pdf' });
    api.get.mockResolvedValue({ data: mockBlob });

    // Mock URL.createObjectURL and other DOM methods
    global.URL.createObjectURL = jest.fn(() => 'fake-url');
    global.URL.revokeObjectURL = jest.fn();
    
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

    renderWithQueryClient(<ReportGenerator companyId={mockCompanyId} />);
    
    // Click generate report button
    const generateButton = screen.getByText('Generate PDF Report');
    fireEvent.click(generateButton);
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('✅ Report generated successfully! Your download should start automatically.')).toBeInTheDocument();
    });

    // Verify download was triggered
    expect(mockLink.click).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
  });

  test('handles report generation error', async () => {
    const { api } = require('../../utils/api');
    api.get.mockRejectedValue(new Error('Generation failed'));

    renderWithQueryClient(<ReportGenerator companyId={mockCompanyId} />);
    
    // Click generate report button
    const generateButton = screen.getByText('Generate PDF Report');
    fireEvent.click(generateButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('❌ Failed to generate report. Please try again or contact support if the issue persists.')).toBeInTheDocument();
    });
  });
});