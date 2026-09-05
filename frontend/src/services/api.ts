import axios from 'axios';
import { Assessment, Device, ComplianceRule } from '../types';
import { getAuthToken } from '../context/AuthContext';

const API_BASE = '/api';
const authHeaders = () => ({ Authorization: `Bearer ${getAuthToken() || ''}` });

export interface CompareResult {
  score_before: number;
  score_after: number;
  score_delta: number;
  vendor_before: string;
  vendor_after: string;
  total_findings_before: number;
  total_findings_after: number;
  resolved_findings: Array<{
    rule_id: string;
    title: string;
    severity: string;
    category: string;
  }>;
  new_findings: Array<{
    rule_id: string;
    title: string;
    severity: string;
    category: string;
  }>;
  diff_lines: Array<{
    type: 'added' | 'removed' | 'unchanged';
    text: string;
  }>;
}

export interface CopilotResponse {
  query: string;
  response: string;
  grounded_context: Record<string, any>;
  provider: string;
  suggestions: string[];
}

export interface ExplainFindingResponse {
  rule_id: string;
  title: string;
  problem: string;
  why_it_matters: string;
  security_impact: string;
  recommended_action: string;
  priority: string;
  remediation_command?: string;
}

export const apiClient = {
  // Upload and run assessment
  uploadConfigs: async (files: File[], assessmentName?: string, manualVendor?: string): Promise<Assessment> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    if (assessmentName) {
      formData.append('assessment_name', assessmentName);
    }
    if (manualVendor) {
      formData.append('manual_vendor', manualVendor);
    }

    try {
      const res = await axios.post(`${API_BASE}/assessment/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...authHeaders() },
        timeout: 30000
      });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Get assessment details
  getAssessment: async (id: string): Promise<Assessment> => {
    try {
      const res = await axios.get(`${API_BASE}/assessment/${id}`, { timeout: 5000, headers: authHeaders() });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // List historical assessments
  listAssessments: async (): Promise<any[]> => {
    try {
      const res = await axios.get(`${API_BASE}/assessment`, { timeout: 5000, headers: authHeaders() });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Delete assessment
  deleteAssessment: async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_BASE}/assessment/${id}`, { headers: authHeaders() });
      return true;
    } catch (err) {
      return false;
    }
  },

  // Get device details
  getDevice: async (deviceId: string): Promise<Device> => {
    try {
      const res = await axios.get(`${API_BASE}/devices/${deviceId}`, { timeout: 5000, headers: authHeaders() });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // List rules
  listRules: async (): Promise<ComplianceRule[]> => {
    try {
      const res = await axios.get(`${API_BASE}/rules`, { timeout: 5000, headers: authHeaders() });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // List vendors
  listVendors: async (): Promise<string[]> => {
    try {
      const res = await axios.get(`${API_BASE}/vendors`, { timeout: 5000, headers: authHeaders() });
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  // Compare Configurations
  compareConfigs: async (beforeConfig: string, afterConfig: string, vendorOverride?: string): Promise<CompareResult> => {
    try {
      const res = await axios.post(`${API_BASE}/compare`, {
        before_config: beforeConfig,
        after_config: afterConfig,
        vendor_override: vendorOverride
      }, { timeout: 15000, headers: authHeaders() });
      return res.data;
    } catch (err) { throw err; }
  },

  // AI Copilot query
  copilotQuery: async (prompt: string, assessmentId?: string): Promise<CopilotResponse> => {
    try {
      const res = await axios.post(`${API_BASE}/copilot/query`, {
        prompt,
        assessment_id: assessmentId
      }, { timeout: 15000, headers: authHeaders() });
      return res.data;
    } catch (err) { throw err; }
  },

  // Explain Finding
  explainFinding: async (findingData: any): Promise<ExplainFindingResponse> => {
    try {
      const res = await axios.post(`${API_BASE}/copilot/explain-finding`, findingData, { timeout: 10000, headers: authHeaders() });
      return res.data;
    } catch (err) { throw err; }
  },

  // Get PDF report URL
  getPdfReportUrl: (assessmentId: string): string => {
    return `${API_BASE}/report/${assessmentId}/pdf`;
  },

  // Download the PDF report as a Blob, surfacing real backend errors
  // instead of silently opening a broken/blank tab (e.g. when the
  // assessment ID belongs to a demo/offline assessment that was never
  // persisted server-side, or when the backend is unreachable).
  downloadPdfReport: async (assessmentId: string, filename?: string): Promise<void> => {
    let blob: Blob;
    try {
      const res = await axios.get(`${API_BASE}/report/${assessmentId}/pdf`, {
        responseType: 'blob',
        timeout: 30000, headers: authHeaders()
      });
      blob = res.data;
    } catch (err) {
      // Axios still returns a Blob in err.response.data when responseType is 'blob',
      // even for error (e.g. 404) responses — parse it to surface the real detail.
      if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          throw new Error(parsed.detail || 'Failed to generate the PDF report.');
        } catch {
          throw new Error(`Failed to generate the PDF report (status ${err.response?.status ?? 'unknown'}).`);
        }
      }
      throw new Error('Could not reach the backend to generate the PDF report.');
    }

    if (blob.type && !blob.type.includes('pdf')) {
      throw new Error('The server did not return a valid PDF file.');
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `NetGuard_Audit_Report_${assessmentId.slice(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
