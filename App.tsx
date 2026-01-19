
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, CaseInput, TabType, EvidenceItem } from './types';
import { analyzeLitigationData, generateBraggingContent } from './services/legalService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  FileText, Layers, Gavel, Loader2, ShieldCheck, Scale, Zap, 
  ArrowRight, Sparkles, MessageSquareText, Landmark, RefreshCw, 
  Download, Image as ImageIcon, ChevronDown, Megaphone, Plus, X, 
  UploadCloud, FileUp, FileType, Lightbulb, HelpCircle, Menu, BookMarked,
  ShieldAlert, Target, Activity, AlertTriangle, PlusCircle, Sword
} from 'lucide-react';

const App: React.FC = () => {
  const [caseInfo, setCaseInfo] = useState('');
  const [claims, setClaims] = useState('');
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('strategy');
  
  const [bragStyle, setBragStyle] = useState('随机');
  const [bragContext, setBragContext] = useState('');
  const [bragResults, setBragResults] = useState<string[]>([]);
  const [isBragLoading, setIsBragLoading] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('legal_case_web_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCaseInfo(parsed.caseInfo || '');
        setClaims(parsed.claims || '');
        setEvidenceList(parsed.evidenceList || []);
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('legal_case_web_draft', JSON.stringify({ caseInfo, claims, evidenceList }));
  }, [caseInfo, claims, evidenceList]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newItem: EvidenceItem = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: (file.size / 1024).toFixed(1) + ' KB',
          data: event.target?.result as string,
          provedFact: '',
          reliability: 'Medium'
        };
        setEvidenceList(prev => [...prev, newItem]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (!caseInfo.trim() && evidenceList.length === 0) {
      alert("请录入案情或上传证据");
      return;
    }
    setIsLoading(true);
    try {
      const data = await analyzeLitigationData({ 
        caseInfo, 
        claims, 
        targetCauses: '', 
        evidenceFiles: evidenceList 
      });
      setResult(data);
      setIsLoading(false);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err: any) {
      alert(err.message);
      setIsLoading(false);
    }
  };

  const handleGenerateBrag = async () => {
    setIsBragLoading(true);
    try {
      const results = await generateBraggingContent(bragStyle, bragContext);
      // 防御性检查，确保 results 是数组以防 React 崩溃
      setBragResults(Array.isArray(results) ? results : []);
    } catch (err: any) {
      console.error(err);
      setBragResults(["请求超时或接口异常，请重试"]);
    } finally {
      setIsBragLoading(false);
    }
  };

  const clearSession = () => {
    if (window.confirm("重置当前工作台内容？")) {
      setCaseInfo('');
      setClaims('');
      setEvidenceList([]);
      setResult(null);
      localStorage.removeItem('legal_case_web_draft');
    }
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <Scale size={24} />
        </div>
        <div>
          <h1 className="font-black text-lg leading-none text-white">诉棍快乐屋</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">律师摸鱼神器</p>
        </div>
      </div>
      <nav className="flex-grow space-y-2">
        <NavBtn active={activeTab === 'strategy'} onClick={() => { setActiveTab('strategy'); setIsMobileMenuOpen(false); }} icon={<Target size={18} />} label="诉讼方案生成" />
        <NavBtn active={activeTab === 'matrix'} onClick={() => { setActiveTab('matrix'); setIsMobileMenuOpen(false); }} icon={<Layers size={18} />} label="证据矩阵审计" />
        <NavBtn active={activeTab === 'bragging'} onClick={() => { setActiveTab('bragging'); setIsMobileMenuOpen(false); }} icon={<Megaphone size={18} />} label="装逼神器" />
      </nav>
    </>
  );

  const getFullHeaderTitle = () => {
    switch(activeTab) {
      case 'strategy': return '诉讼方案生成 —— 基于案情事实，辅助构建核心诉讼逻辑与案由分析';
      case 'matrix': return '证据矩阵审计 —— 预演三性分析，自动化生成质证对抗要点报告';
      case 'bragging': return '装逼神器 —— 提升律师社交影响力的专业话术与摸鱼回复工具';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col md:flex-row font-sans text-slate-900 overflow-x-hidden">
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale size={20} className="text-blue-500" />
          <span className="font-bold">诉棍快乐屋</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu /></button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-slate-900 p-6 flex flex-col animate-in slide-in-from-left">
           <div className="flex justify-end mb-8"><button onClick={() => setIsMobileMenuOpen(false)}><X size={32} className="text-white" /></button></div>
           <SidebarContent />
        </div>
      )}

      <aside className="hidden md:flex w-64 bg-slate-900 flex-col sticky top-0 h-screen p-6 text-white shrink-0">
        <SidebarContent />
      </aside>

      <main className="flex-grow flex flex-col min-w-0">
        <header className="h-16 md:h-20 bg-white border-b px-6 flex items-center justify-between sticky top-0 z-50">
          <h2 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest truncate max-w-[80%]">
            {getFullHeaderTitle()}
          </h2>
          <div className="flex gap-2 shrink-0">
            <button onClick={clearSession} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><RefreshCw size={18} /></button>
            {result && (
              <button onClick={() => window.print()} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-2">
                <Download size={14} /> 导出
              </button>
            )}
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
          {activeTab === 'strategy' && (
            <div className="space-y-6 animate-in">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm p-6 border">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">案情详细描述 (核心事实/时间点)</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed resize-none min-h-[150px]"
                      placeholder="输入背景、关键证据指向的事实、时间节点..."
                      value={caseInfo}
                      onChange={(e) => setCaseInfo(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm p-6 border">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">诉讼请求 (金额/主张)</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed resize-none min-h-[100px]"
                      placeholder="明确主张的事项..."
                      value={claims}
                      onChange={(e) => setClaims(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-3"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                    {isLoading ? '正在进行法律分析...' : '一键生成分析报告'}
                  </button>
                </div>
              </div>

              {result && (
                <div ref={resultRef} className="legal-document-container animate-in">
                   <div className="legal-page">
                      <h1 className="legal-title">法律分析报告</h1>
                      <div className="legal-section">
                        <h2 className="legal-heading">一、 案由分析与利弊对比</h2>
                        <div className="overflow-x-auto -mx-4 md:mx-0">
                          <table className="legal-table">
                            <thead>
                              <tr>
                                <th>建议案由</th>
                                <th>核心分析 (Pros & Cons)</th>
                                <th>难度</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.causeComparison?.map((c, i) => (
                                <tr key={i}>
                                  <td className="font-bold">{c.name}</td>
                                  <td className="text-xs">
                                    <div className="mb-1"><span className="text-green-700 font-bold">优势：</span>{c.pros}</div>
                                    <div><span className="text-red-700 font-bold">风险：</span>{c.cons}</div>
                                  </td>
                                  <td className="text-center">{c.difficulty}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="legal-section">
                        <h2 className="legal-heading">二、 诉讼执行方案</h2>
                        <div className="legal-body">{result.strategy}</div>
                      </div>

                      <div className="legal-section">
                        <h2 className="legal-heading">三、 争议焦点预判</h2>
                        <ol className="legal-list">
                          {result.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
                        </ol>
                      </div>

                      <div className="legal-section">
                        <h2 className="legal-heading">四、 执业风险点与预案</h2>
                        {result.risks.map((r, i) => (
                          <div key={i} className="legal-risk-item mb-4">
                            <strong className="block text-sm border-l-2 border-black pl-2 mb-1">{i+1}. {r.riskPoint}：</strong>
                            <p className="text-xs text-slate-700 ml-3">{r.description}</p>
                            <div className="legal-mitigation mt-1 text-xs ml-3 font-bold">对策建议：{r.mitigation}</div>
                          </div>
                        ))}
                      </div>

                      <div className="legal-section">
                        <h2 className="legal-heading">五、 法律及实务依据</h2>
                        <div className="space-y-3">
                          {result.statutes.map((s, i) => (
                            <p key={i} className="text-[13px] leading-relaxed">《{s.name}》摘要：{s.content}</p>
                          ))}
                        </div>
                      </div>

                      <div className="legal-footer">
                        生成时间：{new Date().toLocaleString()} | 诉棍快乐屋 · 律师摸鱼神器
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'matrix' && (
             <div className="space-y-6">
                <div className="bg-white p-6 md:p-8 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                   <div className="text-center md:text-left">
                     <h3 className="text-xl font-black">证据清单审计矩阵</h3>
                     <p className="text-xs text-slate-400">上传原始证据文件，预演庭审“三性”质证环节</p>
                   </div>
                   <button onClick={() => fileInputRef.current?.click()} className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                     <Plus size={18} /> 添加证明附件
                   </button>
                   <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileUpload} />
                </div>
                {evidenceList.length > 0 && (
                   <div className="bg-white p-6 rounded-2xl border">
                      {evidenceList.map(e => (
                        <div key={e.id} className="flex gap-4 p-4 border-b last:border-0 items-center">
                           <FileType size={24} className="text-blue-500 shrink-0" />
                           <div className="flex-grow min-w-0">
                             <p className="text-sm font-bold truncate">{e.name}</p>
                             <input 
                               className="text-xs text-slate-500 w-full mt-1 border-b border-transparent focus:border-blue-500 outline-none bg-transparent"
                               placeholder="证明目的/关联事实..."
                               value={e.provedFact}
                               onChange={(v) => {
                                 const newList = [...evidenceList];
                                 const idx = newList.findIndex(item => item.id === e.id);
                                 newList[idx].provedFact = v.target.value;
                                 setEvidenceList(newList);
                               }}
                             />
                           </div>
                           <button onClick={() => setEvidenceList(l => l.filter(i => i.id !== e.id))} className="text-slate-300 hover:text-rose-500"><X size={16} /></button>
                        </div>
                      ))}
                      <button onClick={handleAnalyze} disabled={isLoading} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-xl font-bold">
                        {isLoading ? "AI 矩阵分析中..." : "开始审计"}
                      </button>
                   </div>
                )}
                {result && (
                  <div ref={resultRef} className="legal-document-container animate-in">
                    <div className="legal-page">
                      <h1 className="legal-title">证据审计矩阵</h1>
                      <div className="overflow-x-auto -mx-4 md:mx-0">
                        <table className="legal-table mt-8">
                          <thead>
                            <tr><th className="w-1/4">证据名称</th><th>审计意见 (三性分析)</th><th className="w-20">可靠度</th></tr>
                          </thead>
                          <tbody>
                            {result.evidenceList.map((e, i) => (
                              <tr key={i}>
                                <td>{e.name}</td>
                                <td className="text-xs">{e.provedFact}</td>
                                <td className="text-center font-bold">{e.reliability === 'High' ? '高' : '一般'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
             </div>
          )}

          {activeTab === 'bragging' && (
            <div className="max-w-3xl mx-auto space-y-6">
               <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] text-center border shadow-sm">
                  <Megaphone className="mx-auto text-amber-500 mb-6" size={48} />
                  <h3 className="text-2xl font-black">社交影响力话术</h3>
                  <div className="flex flex-wrap gap-2 mt-8 justify-center">
                    {['随机', '高冷', '穷逼', '朋友圈', '回复对方'].map(s => (
                      <button key={s} onClick={() => { setBragStyle(s); if (s !== '回复对方') setBragContext(''); }} className={`px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all ${bragStyle === s ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s}</button>
                    ))}
                  </div>
                  
                  {bragStyle === '回复对方' && (
                    <div className="mt-6 animate-in slide-in-from-top-4 duration-300">
                      <div className="relative">
                        <MessageSquareText className="absolute left-4 top-4 text-slate-300" size={18} />
                        <input 
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder="粘贴对方发来的聊天内容..."
                          value={bragContext}
                          onChange={(e) => setBragContext(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <button onClick={handleGenerateBrag} disabled={isBragLoading} className="w-full mt-8 py-5 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-blue-700 transition-all">
                    {isBragLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />} 快帮我装逼
                  </button>
               </div>
               <div className="grid gap-4">
                  {Array.isArray(bragResults) && bragResults.map((r, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border hover:border-blue-500 transition-all cursor-pointer group shadow-sm active:scale-95" onClick={() => {navigator.clipboard.writeText(r); alert('已复制到剪贴板，去惊艳他们吧！');}}>
                      <p className="font-medium text-slate-800 group-hover:text-blue-600 leading-relaxed">{r}</p>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .legal-document-container {
          background: #D1D5DB;
          padding: 40px 10px;
          display: flex;
          justify-content: center;
          width: 100%;
          box-sizing: border-box;
        }
        .legal-page {
          background: white;
          width: 100%;
          max-width: 800px;
          min-height: 1100px;
          padding: 30mm 20mm;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
          color: black;
          font-family: "SimSun", "STSong", "Songti SC", serif;
          line-height: 1.8;
          box-sizing: border-box;
        }
        .legal-title {
          text-align: center;
          font-size: 26px;
          font-weight: 900;
          margin-bottom: 40px;
          border-bottom: 3px double black;
          padding-bottom: 10px;
          letter-spacing: 2px;
        }
        .legal-section { margin-bottom: 35px; }
        .legal-heading { 
          font-size: 18px; 
          font-weight: 700; 
          margin-bottom: 15px; 
          display: block; 
          border-left: 6px solid black; 
          padding-left: 12px;
          line-height: 1.4;
        }
        .legal-body { text-indent: 2em; text-align: justify; font-size: 15px; white-space: pre-wrap; }
        .legal-list { padding-left: 2.5em; list-style: decimal; font-size: 15px; }
        .legal-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; table-layout: auto; }
        .legal-table th, .legal-table td { border: 1px solid black; padding: 10px; text-align: left; word-break: break-word; }
        .legal-table th { background: #F8F9FA; font-weight: bold; }
        .legal-footer { margin-top: 60px; border-top: 1px solid #000; padding-top: 20px; font-size: 12px; color: #374151; text-align: right; }

        @media (max-width: 768px) {
          .legal-document-container { padding: 0; background: white; }
          .legal-page { 
            padding: 1.5rem 1rem; 
            box-shadow: none; 
            min-height: auto;
            max-width: 100vw;
          }
          .legal-title { font-size: 1.25rem; margin-bottom: 1.5rem; border-bottom-width: 2px; }
          .legal-heading { font-size: 1rem; border-left-width: 4px; padding-left: 8px; }
          .legal-body { font-size: 0.875rem; text-indent: 0; }
          .legal-list { padding-left: 1.2rem; font-size: 0.875rem; }
          .legal-table { font-size: 0.75rem; }
          .legal-table th, .legal-table td { padding: 0.5rem; }
          .legal-footer { margin-top: 2rem; font-size: 0.7rem; }
        }
      `}</style>
    </div>
  );
};

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
    {icon} {label}
  </button>
);

export default App;
