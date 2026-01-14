
export interface EvidenceItem {
  name: string;
  provedFact: string;
  reliability: 'High' | 'Medium' | 'Low';
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
  strategy: string; // 诉讼方案
  keyPoints: string[]; // 关键点
  reinforcement: ReinforcementPoint[];
  risks: LitigationRisk[];
  confrontation: ConfrontationPoint[]; // 模拟对抗
  statutes: StatuteItem[]; // 相应法条
  caseLaw: CaseReference[];
}

export interface CaseInput {
  caseInfo: string;
  claims: string;
  evidenceFiles: File[];
}
