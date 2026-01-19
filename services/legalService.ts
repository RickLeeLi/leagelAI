
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
      temperature: 0.3,
      max_tokens: 3000, 
      top_p: 0.9
    })
  });

  if (!response.ok) throw new Error(`请求失败: ${response.status}`);
  const data = await response.json();
  let content = data.choices[0].message.content;

  // 防御性处理：移除模型可能返回的 Markdown 代码块标识
  if (isJson) {
    content = content.replace(/```json\n?|```/g, "").trim();
  }
  
  return content;
};

export const analyzeLitigationData = async (input: CaseInput): Promise<AnalysisResult> => {
  const systemPrompt = `你是一位专注中国民商事诉讼的资深大律师。
任务：根据案情提供专业的诉讼方案。
核心要求：即使用户没有指定案由，你也必须主动识别2-3个最可能的法律关系（案由），并在报告开头对比它们的举证难度、管辖利弊和赔偿支持度。
性能要求：言简意赅，法条列出关键条款摘要。
格式：必须严格输出 JSON。
JSON 结构：
{
  "causeComparison": [{"name": "案由名称", "pros": "优势", "cons": "劣势", "difficulty": "中/高/低"}],
  "evidenceList": [{"name": "证据名", "provedFact": "审计意见", "reliability": "High/Medium/Low"}],
  "strategy": "标准法律分析报告正文",
  "keyPoints": ["争议焦点"],
  "reinforcement": [{"gap": "事实断裂", "suggestion": "补强方法"}],
  "risks": [{"riskPoint": "风险项", "description": "描述", "mitigation": "建议"}],
  "confrontation": [{"opponentArgument": "对方反驳", "counterStrategy": "我方抗辩建议"}],
  "statutes": [{"name": "法条名", "content": "条款摘要"}],
  "caseLaw": [{"title": "案例", "court": "法院", "summary": "裁判要旨"}]
}`;

  const userPrompt = `
  案情描述：${input.caseInfo}
  诉讼请求：${input.claims}
  证据情况：${input.evidenceFiles.map(e => e.name + "(" + (e.provedFact || "未标注证明目的") + ")").join("; ")}`;

  const content = await callDeepSeek(systemPrompt, userPrompt);
  try {
    const result = JSON.parse(content);
    return result as AnalysisResult;
  } catch (e) {
    console.error("JSON 解析失败:", content);
    throw new Error("AI 返回数据格式错误，请重试");
  }
};

export const generateBraggingContent = async (style: string, context?: string): Promise<string[]> => {
  const systemPrompt = `你是一个幽默犀利的资深律师助手。请根据风格生成5条社交话术或回复。返回格式必须是纯 JSON 字符串数组，例如 ["话术1", "话术2"]。不要包含任何 Markdown 标识。`;
  const userPrompt = `分类风格：${style}${context ? ` 对方聊天内容：${context}` : ''}`;
  const content = await callDeepSeek(systemPrompt, userPrompt);
  try {
    const result = JSON.parse(content);
    // 确保返回的是数组
    if (Array.isArray(result)) return result;
    if (result.results && Array.isArray(result.results)) return result.results;
    return ["生成失败，请稍后重试"];
  } catch (e) {
    console.error("话术 JSON 解析失败:", content);
    return ["生成话术时解析出错，请再试一次"];
  }
};
