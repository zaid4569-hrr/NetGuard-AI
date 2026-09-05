export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface Finding {
  id: string;
  assessment_id: string;
  device_id: string;
  rule_id: string;
  title: string;
  category: string;
  severity: SeverityLevel;
  evidence: string;
  explanation: string;
  recommendation: string;
  remediation_script?: string;
  cis_reference?: string;
  nist_reference?: string;
  iso27001_reference?: string;
  confidence: number;
  correlated_group?: string;
}

export interface CategoryScore {
  category: string;
  score: number;
  findings_count: number;
}

export interface Device {
  id: string;
  assessment_id: string;
  filename: string;
  hostname?: string;
  vendor: string;
  vendor_confidence: number;
  os_version?: string;
  device_type?: string;
  security_score: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  findings?: Finding[];
  category_scores?: CategoryScore[];
}

export interface AICorrelationItem {
  attack_chain_title: string;
  severity: SeverityLevel;
  affected_devices: string[];
  description: string;
  remediation_priority: string;
  action_steps: string[];
}

export interface AIInsights {
  executive_summary: string;
  top_critical_risks: string[];
  correlated_attack_chains: AICorrelationItem[];
  remediation_roadmap: string[];
}

export interface Assessment {
  id: string;
  name: string;
  created_at: string;
  total_devices: number;
  overall_score: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  executive_summary?: string;
  ai_insights?: AIInsights;
  category_scores: CategoryScore[];
  devices: Device[];
  findings: Finding[];
}

export interface ComplianceRule {
  rule_id: string;
  title: string;
  category: string;
  severity: SeverityLevel;
  description: string;
  remediation: string;
  supported_vendors: string[];
  cis_benchmark_ref?: string;
  nist_ref?: string;
  iso27001_ref?: string;
}
