
import { AnalysisResult, CaseInput } from "../types";

const USER_CUSTOM_KEY = "sk-2918a7d216c14a4bb516b154fabff6cf";

const callDeepSeek = async (systemPrompt: string, userPrompt: string, isJson: boolean = true) => {
  const apiKey = USER_CUSTOM_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("未配置 API_KEY");

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: isJson ? { type: "json_object" } : { type: "text" },
      temperature: 0.2,
      max_tokens: 4000
    })
  });

  if (!response.ok) throw new Error(`请求失败: ${response.status}`);
  const data = await response.json();
  let content = data.choices[0].message.content;
  if (isJson) content = content.replace(/```json\n?|```/g, "").trim();
  return content;
};

export const analyzeLitigationData = async (input: CaseInput): Promise<AnalysisResult> => {
  const systemPrompt = `你是一位专注中国民商事诉讼的资深大律师。请基于案情、诉求、管辖地及证据，生成一份极其详尽、具备实操价值的“诉讼策略及证明要件分析报告”。

输出格式必须为 JSON，字段如下：
{
  "causeComparison": [{"pathName": "案由名称", "jurisdiction": "具体管辖建议", "costEstimate": "诉讼费/保全费预估", "pros": "优势分析", "cons": "风险/劣势"}],
  "litigationPlan": "分阶段的诉讼执行具体步骤，包括起诉、保全、调解、庭审等建议。",
  "proofMatrix": [{"elementName": "要件名称", "status": "success|warning|danger", "analysis": "现有证据对该要件的支撑程度分析", "fixSuggestion": "具体的补强证据建议"}],
  "keyIssues": ["核心争议焦点1", "核心争议焦点2"],
  "combatCards": [{"opponentAttack": "对方可能的抗辩点", "counterLogic": "我方应对的反驳逻辑", "supportingEvidence": "支撑反击的法律依据或事实"}],
  "risks": [{"point": "风险点", "plan": "应对预案"}],
  "statutes": [{"name": "法律法规名称", "content": "关键条款摘要"}],
  "compensationSchemes": ["赔偿方案1(计算方式)", "赔偿方案2(计算方式)"]
}

专业要求：
1. 路径选择必须根据建议案由顺序编号。
2. 证明矩阵必须严格按照法律构成要件（如合同纠纷：主体、合同、履行、违约、损失）拆解。
3. 对抗模拟需精准预测庭审攻防。
4. 赔偿方案需给出具体的计算标准。`;

  const userPrompt = `
  案情事实：${input.caseInfo}
  诉讼请求：${input.claims}
  原告地：${input.plaintiffLoc} | 被告地：${input.defendantLoc}
  立场：${input.mySide === 'plaintiff' ? '原告方' : '被告方'}
  证据现状：${input.evidenceFiles.map(e => e.name + (e.provedFact ? `[${e.provedFact}]` : '')).join('; ')}`;

  const content = await callDeepSeek(systemPrompt, userPrompt);
  return JSON.parse(content) as AnalysisResult;
};

export const generateBraggingContent = async (style: string, context?: string): Promise<string[]> => {
  const systemPrompt = `律政社交大师。根据场景生成5条回复或动态。返回纯JSON字符串数组。`;
  const userPrompt = `场景：${style}${context ? ` 对方说：${context}` : ''}`;
  const content = await callDeepSeek(systemPrompt, userPrompt);
  return JSON.parse(content);
};
