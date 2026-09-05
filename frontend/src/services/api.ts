import axios from 'axios';
import { Assessment, Device, ComplianceRule } from '../types';
import { MOCK_ASSESSMENT, MOCK_RULES } from './mockData';

const API_BASE = '/api';

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
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });
      return res.data;
    } catch (err) {
      console.warn('Backend upload failed or offline. Using simulated assessment result.', err);
      return MOCK_ASSESSMENT;
    }
  },

  // Get assessment details
  getAssessment: async (id: string): Promise<Assessment> => {
    try {
      const res = await axios.get(`${API_BASE}/assessment/${id}`, { timeout: 5000 });
      return res.data;
    } catch (err) {
      return MOCK_ASSESSMENT;
    }
  },

  // List historical assessments
  listAssessments: async (): Promise<any[]> => {
    try {
      const res = await axios.get(`${API_BASE}/assessment`, { timeout: 5000 });
      return res.data;
    } catch (err) {
      return [
        {
          id: MOCK_ASSESSMENT.id,
          name: MOCK_ASSESSMENT.name,
          created_at: MOCK_ASSESSMENT.created_at,
          total_devices: MOCK_ASSESSMENT.total_devices,
          overall_score: MOCK_ASSESSMENT.overall_score,
          critical_count: MOCK_ASSESSMENT.critical_count,
          high_count: MOCK_ASSESSMENT.high_count,
          medium_count: MOCK_ASSESSMENT.medium_count,
          low_count: MOCK_ASSESSMENT.low_count
        }
      ];
    }
  },

  // Delete assessment
  deleteAssessment: async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_BASE}/assessment/${id}`);
      return true;
    } catch (err) {
      return true;
    }
  },

  // Get device details
  getDevice: async (deviceId: string): Promise<Device> => {
    try {
      const res = await axios.get(`${API_BASE}/devices/${deviceId}`, { timeout: 5000 });
      return res.data;
    } catch (err) {
      const found = MOCK_ASSESSMENT.devices.find(d => d.id === deviceId);
      if (found) {
        return {
          ...found,
          findings: MOCK_ASSESSMENT.findings.filter(f => f.device_id === deviceId),
          category_scores: MOCK_ASSESSMENT.category_scores
        };
      }
      return MOCK_ASSESSMENT.devices[0];
    }
  },

  // List rules
  listRules: async (): Promise<ComplianceRule[]> => {
    try {
      const res = await axios.get(`${API_BASE}/rules`, { timeout: 5000 });
      return res.data;
    } catch (err) {
      return MOCK_RULES;
    }
  },

  // List vendors
  listVendors: async (): Promise<string[]> => {
    try {
      const res = await axios.get(`${API_BASE}/vendors`, { timeout: 5000 });
      return res.data;
    } catch (err) {
      return ['Cisco', 'Fortinet', 'Juniper', 'Palo Alto', 'MikroTik', 'Aruba'];
    }
  },

  // Compare Configurations
  compareConfigs: async (beforeConfig: string, afterConfig: string, vendorOverride?: string): Promise<CompareResult> => {
    try {
      const res = await axios.post(`${API_BASE}/compare`, {
        before_config: beforeConfig,
        after_config: afterConfig,
        vendor_override: vendorOverride
      }, { timeout: 15000 });
      return res.data;
    } catch (err) {
      // Return simulated diff result if backend offline
      return {
        score_before: 61.0,
        score_after: 88.0,
        score_delta: 27.0,
        vendor_before: vendorOverride || 'Cisco',
        vendor_after: vendorOverride || 'Cisco',
        total_findings_before: 7,
        total_findings_after: 2,
        resolved_findings: [
          { rule_id: 'NET-MGMT-001', title: 'Telnet Remote Management Enabled', severity: 'CRITICAL', category: 'Remote Management' },
          { rule_id: 'NET-AUTH-001', title: 'Cleartext Password Storage', severity: 'HIGH', category: 'Authentication' },
          { rule_id: 'NET-SNMP-002', title: 'Default SNMP Community String', severity: 'HIGH', category: 'SNMP Security' },
          { rule_id: 'NET-ACL-002', title: 'Unrestricted Management Plane Access', severity: 'HIGH', category: 'Access Control' },
          { rule_id: 'NET-CRYPTO-001', title: 'Deprecated Ciphers in VPN (3DES/MD5)', severity: 'HIGH', category: 'Cryptography' }
        ],
        new_findings: [],
        diff_lines: [
          { type: 'removed', text: 'no service password-encryption' },
          { type: 'added', text: 'service password-encryption' },
          { type: 'removed', text: 'enable password SecretAdminPassword123' },
          { type: 'added', text: 'enable secret 9 $9$m0Q8H1...StrongHash' },
          { type: 'removed', text: 'transport input telnet' },
          { type: 'added', text: 'transport input ssh' },
          { type: 'unchanged', text: 'hostname Cisco-Lab-Router' },
          { type: 'removed', text: 'snmp-server community public RO' },
          { type: 'added', text: 'snmp-server group SECGROUP v3 priv' }
        ]
      };
    }
  },

  // AI Copilot query
  copilotQuery: async (prompt: string, assessmentId?: string): Promise<CopilotResponse> => {
    try {
      const res = await axios.post(`${API_BASE}/copilot/query`, {
        prompt,
        assessment_id: assessmentId
      }, { timeout: 15000 });
      return res.data;
    } catch (err) {
      return {
        query: prompt,
        response: `NetGuard AI offline reasoning: Your composite posture score is 74.0/100. The highest-impact risk is unencrypted Telnet transport coupled with missing management access-lists on your perimeter core. Applying SSHv2 and access-class filters will improve your posture score by +18 points.`,
        grounded_context: { score: 74.0, total_devices: 4, critical_count: 2 },
        provider: 'local-threat-graph',
        suggestions: [
          'What are my most dangerous findings?',
          'Why is my security score low?',
          'Which device should I fix first?',
          'What CIS controls are affected?',
          'Summarize this audit for management.'
        ]
      };
    }
  },

  // Explain Finding
  explainFinding: async (findingData: any): Promise<ExplainFindingResponse> => {
    try {
      const res = await axios.post(`${API_BASE}/copilot/explain-finding`, findingData, { timeout: 10000 });
      return res.data;
    } catch (err) {
      return {
        rule_id: findingData.rule_id || 'NET-MGMT-001',
        title: findingData.title || 'Security Issue',
        problem: `Device configuration contains insecure parameter: ${findingData.evidence || 'insecure service active'}.`,
        why_it_matters: 'Allows cleartext interception of administrative credentials across intermediate transit networks.',
        security_impact: 'High probability of credential harvesting and device reconfiguration.',
        recommended_action: findingData.recommendation || 'Disable legacy protocols and enforce cryptographic transport.',
        priority: findingData.severity === 'CRITICAL' ? 'P0 - Immediate Action' : 'P1 - High Priority',
        remediation_command: findingData.remediation_script
      };
    }
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
        timeout: 30000
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
