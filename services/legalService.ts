
import { AnalysisResult, CaseInput } from "../types";

/**
 * 法律分析核心服务
 * 注意：在微信小程序环境中，需将 fetch 替换为 wx.request
 */
export const analyzeLitigationData = async (
  input: CaseInput
): Promise<AnalysisResult> => {
  const apiKey = localStorage.getItem('DEEPSEEK_API_KEY');
  
  if (!apiKey) {
    throw new Error("请在“我的”页面配置您的 API Key");
  }

  const systemPrompt = `你是一位专注中国诉讼的资深律师。请基于《民事诉讼法》及证据规定，对案情进行深度证据矩阵分析。
输出必须是合法的 JSON 格式，包含：
1. evidenceList: 证据清单（含证明对象及证明力评估）
2. reinforcement: 补强建议（针对证据链缺口）
3. risks: 诉讼风险评估
4. caseLaw: 相似类案参考
不要输出任何非 JSON 文本。`;

  const userPrompt = `
案情：${input.caseInfo}
诉求：${input.claims}
请生成证据矩阵报告。`;

  try {
    /* 微信小程序环境建议代码示例:
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://api.deepseek.com/chat/completions',
        method: 'POST',
        header: { 'Authorization': 'Bearer ' + apiKey },
        data: { model: 'deepseek-chat', messages: [...] },
        success: (res) => resolve(JSON.parse(res.data.choices[0].message.content)),
        fail: (err) => reject(err)
      })
    });
    */

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
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error("DeepSeek 接口连接失败，请检查 API Key 或网络");
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as AnalysisResult;
  } catch (error: any) {
    throw new Error(error.message || "分析引擎连接超时");
  }
};
