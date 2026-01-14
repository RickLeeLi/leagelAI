
import { AnalysisResult, CaseInput } from "../types";

// ========================================================
// ！！！在此处填入你生成的 Base64 字符串 ！！！
// 只有在这里填入，其他用户访问你的网址时才不需要输入 Key
// ========================================================
const EMBEDDED_KEY_B64 = "c2stMjkxOGE3ZDIxNmMxNGE0YmI1MTZiMTU0ZmFiZmY2Y2Y="; // 例如: "c2stTjZleU1S..."

/**
 * 法律分析核心服务
 */
export const analyzeLitigationData = async (
  input: CaseInput
): Promise<AnalysisResult> => {
  // 优先级：
  // 1. 浏览器本地手动录入的 Key (优先级最高，方便你随时临时更换测试)
  // 2. 代码硬编码内置的 Key (供普通访问者使用)
  const manualKey = localStorage.getItem('DEEPSEEK_API_KEY');
  let apiKey = manualKey;

  if (!apiKey && EMBEDDED_KEY_B64) {
    try {
      apiKey = atob(EMBEDDED_KEY_B64);
    } catch (e) {
      console.error("内置 Key 解析失败，请检查 Base64 格式是否正确");
    }
  }
  
  if (!apiKey) {
    throw new Error("服务未配置：内置 Key 为空且未手动设置。请进入开发者模式进行配置。");
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
      const errorText = await response.text();
      let errorInfo;
      try {
        errorInfo = JSON.parse(errorText);
      } catch (e) {
        errorInfo = { error: { message: errorText } };
      }

      if (response.status === 402) {
        throw new Error("API 账户余额不足：请提醒管理员充值。");
      } else if (response.status === 401) {
        throw new Error("API Key 无效：内置的密钥可能已过期或被撤销。");
      }
      
      throw new Error(errorInfo.error?.message || `请求失败 (${response.status})`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    if (content.startsWith("```")) {
      content = content.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }

    return JSON.parse(content) as AnalysisResult;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error("网络连接失败：直接调用 DeepSeek 接口可能存在跨域限制。如果是在网页运行，建议安装浏览器 CORS 插件，或在本地环境下通过特定的代理模式运行。");
    }
    throw error;
  }
};
