
export interface EvidenceItem {
  id: string;
  name: string;
  type: string;
  size: string;
  data?: string;
  provedFact: string;
  reliability: 'High' | 'Medium' | 'Low';
}

export interface ProofElement {
  elementName: string;
  status: 'success' | 'warning' | 'danger';
  analysis: string;
  fixSuggestion: string;
}

export interface CombatCard {
  opponentAttack: string;
  counterLogic: string;
  supportingEvidence: string;
}

export interface LitigationRisk {
  point: string;
  plan: string;
}

export interface AnalysisResult {
  causeComparison: {
    pathName: string;
    jurisdiction: string;
    costEstimate: string;
    pros: string;
    cons: string;
  }[];
  litigationPlan: string; // 诉讼执行方案
  proofMatrix: ProofElement[]; // 法律要件证明矩阵
  keyIssues: string[]; // 争议焦点预判
  combatCards: CombatCard[]; // 红蓝对抗模拟
  risks: LitigationRisk[]; // 执业风险点与预案
  statutes: { name: string; content: string }[]; // 法条及实务依据
  compensationSchemes: string[]; // 可能的赔偿方案
  strategy: string; // 总体综述（可选）
}

export interface CaseInput {
  caseInfo: string;
  claims: string;
  plaintiffLoc: string;
  defendantLoc: string;
  mySide: 'plaintiff' | 'defendant';
  strategyFocus: string[];
  evidenceFiles: EvidenceItem[];
}

export type TabType = 'strategy' | 'matrix' | 'bragging';
