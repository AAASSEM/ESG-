// ESGReportDownload.tsx - Component for downloading ESG reports
import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  CircularProgress,
  Alert,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  PictureAsPdf as PdfIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface ESGReportDownloadProps {
  companyId: string;
}

export default function ESGReportDownload({ companyId }: ESGReportDownloadProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const { token } = useAuth();

  const handleShowPreview = async () => {
    if (!token || !companyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reports/companies/${companyId}/report/preview-data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load preview');
      }
      
      const data = await response.json();
      setPreviewData(data);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!token || !companyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reports/companies/${companyId}/report/esg-pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ESG_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setShowPreview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconProps = { fontSize: 'small' as const };
    switch (category) {
      case 'environmental':
        return <CheckIcon {...iconProps} color="success" />;
      case 'social':
        return <CheckIcon {...iconProps} color="info" />;
      case 'governance':
        return <CheckIcon {...iconProps} color="warning" />;
      default:
        return <AssessmentIcon {...iconProps} />;
    }
  };

  const getCompletionColor = (rate: number): "success" | "warning" | "error" => {
    if (rate >= 80) return "success";
    if (rate >= 60) return "warning";
    return "error";
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={loading ? <CircularProgress size={20} /> : <PdfIcon />}
        onClick={handleShowPreview}
        disabled={loading}
        sx={{ 
          background: 'linear-gradient(45deg, #1a472a 30%, #2d5f3f 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #2d5f3f 30%, #1a472a 90%)',
          }
        }}
      >
        Generate ESG Report
      </Button>

      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <PdfIcon color="error" />
            <Typography variant="h6">ESG Report Preview</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}
          
          {previewData && (
            <>
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>Report Details</Typography>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                  <Typography><strong>Company:</strong> {previewData.company.name}</Typography>
                  <Typography><strong>Sector:</strong> {previewData.company.sector}</Typography>
                  <Typography><strong>Location:</strong> {previewData.company.location}</Typography>
                  <Typography><strong>Report Date:</strong> {new Date().toLocaleDateString()}</Typography>
                </Box>
              </Box>

              <Box mb={3}>
                <Typography variant="h6" gutterBottom>Performance Summary</Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Chip 
                    label={`${previewData.summary.completed_tasks}/${previewData.summary.total_tasks} Tasks Complete`}
                    color={getCompletionColor(previewData.summary.completion_rate)}
                    variant="outlined"
                  />
                  <Chip 
                    label={`${previewData.summary.completion_rate.toFixed(1)}% Completion`}
                    color={getCompletionColor(previewData.summary.completion_rate)}
                  />
                  <Chip 
                    label={`${previewData.summary.high_priority_tasks} High Priority`}
                    color="warning"
                    variant="outlined"
                  />
                </Box>
              </Box>

              <Box mb={3}>
                <Typography variant="h6" gutterBottom>Category Breakdown</Typography>
                <List dense>
                  {Object.entries(previewData.categories).map(([category, stats]: [string, any]) => (
                    <ListItem key={category}>
                      <ListItemIcon>
                        {getCategoryIcon(category)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={category.charAt(0).toUpperCase() + category.slice(1)}
                        secondary={`${stats.completed}/${stats.total} tasks completed`}
                      />
                      <Chip 
                        size="small"
                        label={`${((stats.completed / stats.total) * 100).toFixed(0)}%`}
                        color={getCompletionColor((stats.completed / stats.total) * 100)}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>Report Contents</Typography>
                <List dense>
                  {previewData.report_sections.map((section: string) => (
                    <ListItem key={section}>
                      <ListItemIcon>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={section} />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                The report will be generated in PDF format and includes detailed analysis of your ESG performance, 
                compliance status, and recommendations for improvement.
              </Alert>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
          <Button onClick={() => setShowPreview(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
            disabled={loading || !previewData}
          >
            Download PDF Report
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}