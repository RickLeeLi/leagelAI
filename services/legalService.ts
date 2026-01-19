
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, CaseInput } from "../types";

// Always use process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLitigationData = async (
  input: CaseInput
): Promise<AnalysisResult> => {
  /* Use gemini-3-pro-preview for complex reasoning tasks like legal analysis */
  const systemPrompt = `你是一位专注中国民商事诉讼的资深大律师。
请基于《民法典》、《民事诉讼法》及其证据规定，对输入的案情 and 证据清单进行全维度法律分析。
如果是审计证据，请重点评估证据的‘三性’（真实性、合法性、关联性）。
你必须严格输出符合指定结构的 JSON 对象，不要包含 Markdown 代码块。`;

  const evidenceDescription = input.evidenceFiles.map(f => `文件名：${f.name}, 律师标注的证明目的：${f.provedFact}`).join('\n');
  const userPrompt = `案情描述：${input.caseInfo}\n诉讼请求：${input.claims}\n证据清单：\n${evidenceDescription}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            evidenceList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  provedFact: { type: Type.STRING },
                  reliability: { type: Type.STRING }
                },
                required: ['name', 'provedFact', 'reliability']
              }
            },
            strategy: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            reinforcement: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  gap: { type: Type.STRING },
                  suggestion: { type: Type.STRING }
                },
                required: ['gap', 'suggestion']
              }
            },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  riskPoint: { type: Type.STRING },
                  description: { type: Type.STRING },
                  mitigation: { type: Type.STRING }
                },
                required: ['riskPoint', 'description', 'mitigation']
              }
            },
            confrontation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  opponentArgument: { type: Type.STRING },
                  counterStrategy: { type: Type.STRING }
                },
                required: ['opponentArgument', 'counterStrategy']
              }
            },
            statutes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ['name', 'content']
              }
            },
            caseLaw: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  court: { type: Type.STRING },
                  year: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  outcome: { type: Type.STRING }
                },
                required: ['title', 'court', 'year', 'summary', 'outcome']
              }
            }
          },
          required: ['evidenceList', 'strategy', 'keyPoints', 'reinforcement', 'risks', 'confrontation', 'statutes', 'caseLaw']
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
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
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateBraggingContent = async (
  style: string,
  context?: string
): Promise<string[]> => {
  /* Use gemini-3-flash-preview for simpler content generation tasks */
  const systemPrompt = `你是一位精通人情世故、深谙律师圈潜规则、谈吐不凡的资深大律师。任务：生成5条用于微信群聊或社交场合的‘装逼’话术或专业回复。直接返回一个包含5个字符串的 JSON 数组。`;
  const userPrompt = `风格：${style}${context ? `\n背景：${context}` : ''}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Bragging Error:", error);
    return ["AI 暂时短路，请稍后再试。"];
  }
};
