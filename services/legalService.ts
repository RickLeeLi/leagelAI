
import { AnalysisResult, CaseInput } from "../types";

const EMBEDDED_KEY_B64 = "c2stMjkxOGE3ZDIxNmMxNGE0YmI1MTZiMTU0ZmFiZmY2Y2Y=";

export const analyzeLitigationData = async (
  input: CaseInput
): Promise<AnalysisResult> => {
  const manualKey = localStorage.getItem('DEEPSEEK_API_KEY');
  let apiKey = manualKey;

  if (!apiKey && EMBEDDED_KEY_B64) {
    try {
      apiKey = atob(EMBEDDED_KEY_B64);
    } catch (e) {
      console.error("内置 Key 解析失败");
    }
  }
  
  if (!apiKey) {
    throw new Error("服务未配置，请联系管理员。");
  }

  const systemPrompt = `你是一位专注中国民商事诉讼的资深大律师。
请基于《民法典》、《民事诉讼法》及其证据规定，对输入的案情进行全维度法律分析。
必须严格输出合法的 JSON 对象，内容严禁缺失以下任何一个键：
1. evidenceList: 数组，每个对象包含 (name, provedFact, reliability: 'High'|'Medium'|'Low')
2. strategy: 字符串，核心诉讼策略与执行方案
3. keyPoints: 字符串数组，3-5个关键法律争议点
4. reinforcement: 数组，每个对象包含 (gap, suggestion) 证据补强建议
5. risks: 数组，每个对象包含 (riskPoint, description, mitigation) 风险评估
6. confrontation: 数组，每个对象包含 (opponentArgument, counterStrategy) 模拟对抗
7. statutes: 数组，每个对象包含 (name, content) 引用法条
8. caseLaw: 数组，每个对象包含 (title, court, year, summary, outcome) 类案参考
注意：所有内容必须符合中国现行法律。不要包含 Markdown 代码块标签，直接输出 JSON 文本。`;

  const userPrompt = `案情描述：${input.caseInfo}\n诉讼请求：${input.claims}`;

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
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
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    if (content.startsWith("```")) {
      content = content.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }
    
    const result = JSON.parse(content);
    
    // 强制补全可能缺失的字段，确保 UI 不会崩溃
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
    throw error;
  }
};
