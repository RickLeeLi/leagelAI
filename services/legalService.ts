
import { AnalysisResult, CaseInput } from "../types";

/**
 * 提示：如果您在本地双击 HTML 运行，请直接在下方引号内填入您的 DeepSeek API Key。
 * 如果您部署在 Cloudflare Pages 或 Vercel，请在后台设置 API_KEY 环境变量。
 */
const USER_CUSTOM_KEY = "sk-2918a7d216c14a4bb516b154fabff6cf"; // <--- 在这里填入您的 DeepSeek API Key

/**
 * DeepSeek API 调用封装
 */
const callDeepSeek = async (systemPrompt: string, userPrompt: string, isJson: boolean = true) => {
  // 优先顺序：代码内填写的 Key > 环境变量
  const apiKey = USER_CUSTOM_KEY || process.env.API_KEY;
  
  if (!apiKey || apiKey === "") {
    throw new Error("未检测到 DeepSeek API Key。\n\n本地运行：请用记事本打开 services/legalService.ts，在 USER_CUSTOM_KEY 处填入您的 Key。\n服务器运行：请在环境变量中配置 API_KEY。");
  }

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
      stream: false,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error("API Key 校验失败，请检查您的 DeepSeek 余额或 Key 是否正确。");
    }
    throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export const analyzeLitigationData = async (
  input: CaseInput
): Promise<AnalysisResult> => {
  const systemPrompt = `你是一位专注中国民商事诉讼的资深大律师。
任务：基于案情和证据清单进行法律分析。如果是审计证据，重点评估真实性、合法性、关联性。
必须严格输出 JSON 格式，结构如下：
{
  "evidenceList": [{"name": "...", "provedFact": "...", "reliability": "High/Medium/Low"}],
  "strategy": "全局诉讼策略描述",
  "keyPoints": ["争议焦点1", "争议焦点2"],
  "reinforcement": [{"gap": "证据断裂点", "suggestion": "补强方案"}],
  "risks": [{"riskPoint": "风险点", "description": "描述", "mitigation": "对策"}],
  "confrontation": [{"opponentArgument": "对方可能主张", "counterStrategy": "我方反驳要点"}],
  "statutes": [{"name": "法条名称", "content": "法条内容"}],
  "caseLaw": [{"title": "案例标题", "court": "法院", "year": "年份", "summary": "裁判摘要", "outcome": "胜诉"}]
}`;

  const evidenceDescription = input.evidenceFiles.map(f => `文件名：${f.name}, 律师标注目的：${f.provedFact}`).join('\n');
  const userPrompt = `案情描述：${input.caseInfo}\n诉讼请求：${input.claims}\n证据清单：\n${evidenceDescription}`;

  try {
    const content = await callDeepSeek(systemPrompt, userPrompt);
    const result = JSON.parse(content);
    
    return {
      evidenceList: result.evidenceList || [],
      strategy: result.strategy || "",
      keyPoints: result.keyPoints || [],
      reinforcement: result.reinforcement || [],
      risks: result.risks || [],
      confrontation: result.confrontation || [],
      statutes: result.statutes || [],
      caseLaw: result.caseLaw || []
    } as AnalysisResult;
  } catch (error: any) {
    console.error("DeepSeek Analysis Error:", error);
    throw error;
  }
};

export const generateBraggingContent = async (
  style: string,
  context?: string
): Promise<string[]> => {
  const systemPrompt = `你是一位精通律师圈潜规则、谈吐不凡的大律师。生成5条律师社交‘装逼’话术或专业回复。
必须直接返回一个 JSON 数组，例如: ["话术1", "话术2", ...]`;
  
  const userPrompt = `风格：${style}${context ? `\n背景环境：${context}` : ''}`;

  try {
    const content = await callDeepSeek(systemPrompt, userPrompt);
    return JSON.parse(content);
  } catch (error) {
    console.error("DeepSeek Bragging Error:", error);
    return ["AI 正在开庭，请稍后再试。"];
  }
};
