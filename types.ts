
export interface EvidenceItem {
  id: string;
  name: string;
  type: string;
  size: string;
  data?: string; // Base64
  provedFact: string; // 拟证明事实
  reliability: 'High' | 'Medium' | 'Low';
  auditOpinion?: string; // AI 审计意见
}

export interface ReinforcementPoint {
  gap: string;
  suggestion: string;
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
}

export interface StatuteItem {
  name: string;
  content: string;
}

export interface ConfrontationPoint {
  opponentArgument: string;
  counterStrategy: string;
}

export interface AnalysisResult {
  evidenceList: EvidenceItem[];
  strategy: string; 
  keyPoints: string[]; 
  reinforcement: ReinforcementPoint[];
  risks: LitigationRisk[];
  confrontation: ConfrontationPoint[]; 
  statutes: StatuteItem[]; 
  caseLaw: CaseReference[];
}

export interface CaseInput {
  caseInfo: string;
  claims: string;
  evidenceFiles: EvidenceItem[];
}

export type TabType = 'strategy' | 'matrix' | 'bragging' | 'settings';
