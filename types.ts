
export interface EvidenceItem {
  id: string;
  name: string;
  type: string;
  provedFact: string;
  source: string;
  reliability: 'High' | 'Medium' | 'Low';
}

export interface ReinforcementPoint {
  gap: string;
  suggestion: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface LitigationRisk {
  riskPoint: string;
  description: string;
  mitigation: string;
}

export interface CaseReference {
  title: string;
  court: string;
  year: string;
  summary: string;
  outcome: string;
  similarity: number;
}

export interface AnalysisResult {
  evidenceList: EvidenceItem[];
  reinforcement: ReinforcementPoint[];
  risks: LitigationRisk[];
  caseLaw: CaseReference[];
}

export interface CaseInput {
  caseInfo: string;
  claims: string;
  evidenceFiles: File[];
}
