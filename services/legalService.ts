
import { AnalysisResult, CaseInput } from "../types";

/**
 * 法律分析核心服务
 */
export const analyzeLitigationData = async (
  input: CaseInput
): Promise<AnalysisResult> => {
  const apiKey = localStorage.getItem('DEEPSEEK_API_KEY');
  
  if (!apiKey) {
    throw new Error("请在“系统配置”页面设置您的 DeepSeek API Key");
  }

  const systemPrompt = `你是一位专注中国诉讼的资深律师。请基于《民事诉讼法》及证据规定，对案情进行深度证据矩阵分析。
必须严格输出合法的 JSON 对象，不要包含任何解释性文字或 Markdown 标签。
JSON 结构需包含：
1. evidenceList: 证据清单（name, provedFact, reliability: 'High'|'Medium'|'Low'）
2. reinforcement: 补强建议（gap, suggestion）
3. risks: 诉讼风险评估（riskPoint, description, mitigation）
4. caseLaw: 相似类案参考（title, court, year, summary, outcome）`;

  const userPrompt = `
案情事实：${input.caseInfo}
诉讼请求：${input.claims}
请针对以上内容生成证据矩阵报告。`;

  try {
    const response = await fetch("https://deepseek-proxy.wxxcxzhuanyong.workers.dev/v1/chat/completions", {
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
      const errorText = await response.text();
      let errorInfo;
      try {
        errorInfo = JSON.parse(errorText);
      } catch (e) {
        errorInfo = { error: { message: errorText } };
      }

      // 针对常见错误码进行中文转义
      if (response.status === 402) {
        throw new Error("API 账户余额不足：请前往 DeepSeek 官网充值后再试。");
      } else if (response.status === 401) {
        throw new Error("API Key 无效：请检查设置中的 Key 是否填写正确。");
      } else if (response.status === 429) {
        throw new Error("请求频率过高：请稍后再试。");
      }
      
      throw new Error(errorInfo.error?.message || `服务器请求失败 (${response.status})`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    // 清洗 Markdown 标签
    if (content.startsWith("```")) {
      content = content.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }

    return JSON.parse(content) as AnalysisResult;
  } catch (error: any) {
    console.error("LegalService Error:", error);
    throw error;
  }
};
