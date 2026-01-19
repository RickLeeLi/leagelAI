
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, CaseInput } from './types';
import { analyzeLitigationData, generateBraggingContent } from './services/legalService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  FileText, Layers, Settings, CheckCircle, AlertTriangle, Gavel, 
  Loader2, ShieldCheck, Scale, Trash2, Key, Zap, Copy, FileSearch, 
  BookOpen, ArrowRight, Sparkles, Info, Lock, Unlock, ShieldAlert,
  Sword, BookMarked, MessageSquareText, Landmark, RefreshCw, PlusCircle,
  Download, Image as ImageIcon, ChevronDown, User, Coffee, Megaphone, Send
} from 'lucide-react';

const App: React.FC = () => {
  const [caseInfo, setCaseInfo] = useState('');
  const [claims, setClaims] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'settings' | 'bragging'>('input');
  const [apiKey, setApiKey] = useState(localStorage.getItem('DEEPSEEK_API_KEY') || '');
  const [devMode, setDevMode] = useState(localStorage.getItem('DEV_MODE') === 'true');
  const [logoClicks, setLogoClicks] = useState(0);
  
  // 装逼神器状态
  const [bragStyle, setBragStyle] = useState('随机');
  const [bragContext, setBragContext] = useState('');
  const [bragResults, setBragResults] = useState<string[]>([]);
  const [isBragLoading, setIsBragLoading] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    if (newCount >= 5) {
      const targetMode = !devMode;
      setDevMode(targetMode);
      setLogoClicks(0);
      localStorage.setItem('DEV_MODE', String(targetMode));
      alert(targetMode ? "开发者模式已开启" : "开发者模式已关闭");
    } else {
      setLogoClicks(newCount);
      setTimeout(() => setLogoClicks(0), 3000);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('legal_case_web_draft');
    if (saved) {
      try {
        const { caseInfo: sCase, claims: sClaims } = JSON.parse(saved);
        setCaseInfo(sCase || '');
        setClaims(sClaims || '');
      } catch(e) {}
    }
    const savedResult = localStorage.getItem('legal_analysis_result');
    if (savedResult) {
      try { 
        const parsed = JSON.parse(savedResult);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.evidenceList || [])) {
          setResult(parsed); 
        } else {
          localStorage.removeItem('legal_analysis_result');
        }
      } catch(e) {
        localStorage.removeItem('legal_analysis_result');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('legal_case_web_draft', JSON.stringify({ caseInfo, claims }));
  }, [caseInfo, claims]);

  const handleAnalyze = async () => {
    if (!caseInfo.trim() || !claims.trim()) {
      alert("请填写案情及诉请");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const data = await analyzeLitigationData({ caseInfo, claims, evidenceFiles: [] });
      setResult(data);
      localStorage.setItem('legal_analysis_result', JSON.stringify(data));
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err: any) {
      setError(err.message || '分析过程中发生未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBrag = async () => {
    setIsBragLoading(true);
    try {
      const results = await generateBraggingContent(bragStyle, bragContext);
      setBragResults(results);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsBragLoading(false);
    }
  };

  const clearSession = () => {
    if (window.confirm("确定要清除当前案情和分析结果吗？")) {
      setCaseInfo('');
      setClaims('');
      setResult(null);
      localStorage.removeItem('legal_case_web_draft');
      localStorage.removeItem('legal_analysis_result');
    }
  };

  const generateCanvas = async () => {
    if (!resultRef.current) return null;
    setIsExporting(true);
    await new Promise(r => setTimeout(r, 100));
    try {
      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#F8FAFC',
        windowWidth: 1200,
      });
      return canvas;
    } catch (err) {
      console.error("生成画布失败", err);
      alert("生成失败，请重试");
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  const exportToImage = async () => {
    const canvas = await generateCanvas();
    if (!canvas) return;
    const image = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = image;
    link.download = `法律分析报告_${new Date().toLocaleDateString()}.png`;
    link.click();
    setShowExportMenu(false);
  };

  const exportToPDF = async () => {
    const canvas = await generateCanvas();
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`法律分析报告_${new Date().toLocaleDateString()}.pdf`);
    setShowExportMenu(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 flex-col sticky top-0 h-screen p-6 text-white shrink-0">
        <div onClick={handleLogoClick} className="flex items-center gap-3 mb-10 cursor-pointer select-none group transition-transform active:scale-95">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50 group-hover:bg-blue-500 transition-colors">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="font-black tracking-tighter text-lg leading-none">Litigation</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Matrix Pro</p>
          </div>
        </div>

        <nav className="flex-grow space-y-2">
          <NavBtn active={activeTab === 'input'} onClick={() => setActiveTab('input')} icon={<FileSearch size={18} />} label="分析工作台" />
          <NavBtn active={activeTab === 'bragging'} onClick={() => setActiveTab('bragging')} icon={<Megaphone size={18} />} label="装逼神器" />
          {devMode && <NavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="系统配置" />}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="p-4 bg-slate-800/50 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DeepSeek Engine</span>
              <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><ShieldCheck size={10} /> 安全加密通道</p>
            </div>
            {devMode ? <Unlock size={14} className="text-blue-400" /> : <Lock size={14} className="text-slate-600" />}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            <span>Legal Analysis</span>
            <ArrowRight size={10} />
            <span className="text-slate-900">{activeTab === 'input' ? 'Workbench' : activeTab === 'bragging' ? 'Bragging Tool' : 'Settings'}</span>
          </div>
          <div className="flex items-center gap-3">
             {activeTab === 'input' && (
               <button onClick={clearSession} title="重置" className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                 <RefreshCw size={18} />
               </button>
             )}
             
             {result && activeTab === 'input' && (
               <div className="relative" ref={exportMenuRef}>
                 <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={isExporting}
                  className="flex items-center gap-2 text-[10px] font-black bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-all active:scale-95 disabled:bg-slate-400"
                 >
                   {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                   {isExporting ? '处理中...' : '导出报告'}
                   <ChevronDown size={10} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                 </button>

                 {showExportMenu && (
                   <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                     <button 
                      onClick={exportToPDF}
                      className="w-full px-5 py-3 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                     >
                       <FileText size={14} className="text-rose-500" /> 导出为 PDF
                     </button>
                     <button 
                      onClick={exportToImage}
                      className="w-full px-5 py-3 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                     >
                       <ImageIcon size={14} className="text-blue-500" /> 导出为高清长图
                     </button>
                   </div>
                 )}
               </div>
             )}
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
          {activeTab === 'input' && (
            <div className="space-y-6 animate-in">
              {error && (
                <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl flex items-start gap-4">
                  <AlertTriangle className="text-rose-600 shrink-0" size={20} />
                  <div>
                    <h4 className="text-rose-900 font-black text-sm uppercase mb-1">分析失败</h4>
                    <p className="text-rose-700 text-xs font-medium">{error}</p>
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <FileText size={16} className="text-blue-600" />
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">案情事实录入</label>
                    </div>
                    <textarea 
                      className="w-full h-80 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none text-sm leading-[1.8] transition-all resize-none"
                      placeholder="请详尽输入案件事实经过，包括时间、人物、起因、经过、结果..."
                      value={caseInfo}
                      onChange={(e) => setCaseInfo(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Gavel size={16} className="text-blue-600" />
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">诉讼请求</label>
                    </div>
                    <textarea 
                      className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none text-sm transition-all resize-none"
                      placeholder="例如：1.判令被告偿还贷款20万元及利息；2.本案诉讼费由被告承担。"
                      value={claims}
                      onChange={(e) => setClaims(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full py-10 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 transition-all flex flex-col items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={32} /> : <Zap size={32} />}
                    {isLoading ? '正在进行AI推理...' : '开始深度分析'}
                  </button>
                </div>
              </div>

              {result && (
                <div ref={resultRef} className="space-y-10 pt-12 animate-in pb-20 bg-[#F8FAFC]">
                  <div className="flex items-center gap-3 px-2">
                    <Sparkles className="text-amber-500" size={28} />
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">结构化法律分析报告</h2>
                  </div>

                  {/* 核心诉讼策略 */}
                  <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden mx-2">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none"></div>
                    <div className="flex items-center gap-4 mb-6 relative">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <ShieldCheck size={24} />
                      </div>
                      <h3 className="text-lg font-black uppercase tracking-widest">核心诉讼方案</h3>
                    </div>
                    <p className="text-lg leading-relaxed text-blue-50/90 font-medium whitespace-pre-wrap">{result.strategy || "暂无方案内容"}</p>
                  </div>

                  {/* 证据矩阵 */}
                  <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden mx-2">
                    <div className="px-10 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                      <Layers size={20} className="text-blue-600" />
                      <h3 className="font-black text-sm uppercase tracking-widest text-slate-600">证据矩阵分析</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th className="px-10 py-5">证据项</th>
                            <th className="px-10 py-5">待证事实</th>
                            <th className="px-10 py-5 text-center">证明力</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {(result.evidenceList || []).map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-10 py-6 font-bold text-slate-800 text-sm">{item?.name || '未知证据'}</td>
                              <td className="px-10 py-6 text-slate-600 text-sm leading-relaxed">{item?.provedFact || '未知事实'}</td>
                              <td className="px-10 py-6 text-center">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                                  item?.reliability === 'High' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {item?.reliability === 'High' ? '强' : '中/弱'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 证据补强建议 */}
                  <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10 mx-2">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <PlusCircle size={22} className="text-indigo-600" />
                      </div>
                      <h3 className="font-black text-sm uppercase tracking-widest">证据补强建议</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      {(result.reinforcement || []).map((item, i) => (
                        <div key={i} className="p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100/50 flex flex-col">
                          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">存在缺口</div>
                          <p className="text-sm font-bold text-slate-800 mb-4">{item?.gap || '未识别具体缺口'}</p>
                          <div className="mt-auto pt-4 border-t border-indigo-100/50">
                            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                              <CheckCircle size={10} /> 补强方案
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{item?.suggestion || '暂无具体建议'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="grid md:grid-cols-2 gap-8 px-2">
                    {/* 关键法律焦点 */}
                    <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          <MessageSquareText size={22} className="text-blue-600" />
                        </div>
                        <h3 className="font-black text-sm uppercase tracking-widest">关键法律焦点</h3>
                      </div>
                      <div className="space-y-4">
                        {(result.keyPoints || []).map((point, i) => (
                          <div key={i} className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl group hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-blue-100">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600 shrink-0">{i+1}</div>
                            <p className="text-sm font-bold text-slate-700">{point || '未提炼关键点'}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* 风险预警 */}
                    <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                          <ShieldAlert size={22} className="text-rose-600" />
                        </div>
                        <h3 className="font-black text-sm uppercase tracking-widest">诉讼风险评估</h3>
                      </div>
                      <div className="space-y-4">
                        {(result.risks || []).map((risk, i) => (
                          <div key={i} className="p-6 bg-rose-50/30 rounded-3xl border border-rose-100/50">
                            <h4 className="text-sm font-black text-rose-800 mb-2">{risk?.riskPoint || '未知风险'}</h4>
                            <p className="text-xs text-slate-500 mb-4">{risk?.description || '暂无描述'}</p>
                            <div className="bg-white px-3 py-2 rounded-xl text-[10px] font-black text-blue-600 inline-flex items-center gap-2 border border-blue-50 shadow-sm">
                              <CheckCircle size={10} /> 应对方案：{risk?.mitigation || '等待方案生成'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* 模拟对抗 */}
                  <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10 mx-2">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Sword size={22} className="text-amber-600" />
                      </div>
                      <h3 className="font-black text-sm uppercase tracking-widest">模拟法庭对抗分析</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                      {(result.confrontation || []).map((item, i) => (
                        <div key={i} className="space-y-4">
                          <div className="p-6 bg-slate-900 text-white rounded-[2rem] relative shadow-lg">
                            <span className="absolute -top-3 left-6 px-3 py-1 bg-rose-500 text-[10px] font-black uppercase rounded-full shadow-md">对方抗辩可能</span>
                            <p className="text-sm font-medium opacity-90">{item?.opponentArgument || '未识别抗辩点'}</p>
                          </div>
                          <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 relative shadow-sm">
                            <span className="absolute -top-3 left-6 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-full shadow-md">我方应对策略</span>
                            <p className="text-sm font-bold text-emerald-900">{item?.counterStrategy || '未识别应对点'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 法律条文与案例 */}
                  <div className="grid lg:grid-cols-3 gap-8 px-2 pb-10">
                    <div className="lg:col-span-1 bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-xl">
                      <div className="flex items-center gap-4 mb-8">
                        <BookMarked size={24} />
                        <h3 className="font-black text-sm uppercase tracking-widest">引用法律依据</h3>
                      </div>
                      <div className="space-y-8">
                        {(result.statutes || []).map((item, i) => (
                          <div key={i} className="border-l-2 border-blue-300 pl-4">
                            <h4 className="text-xs font-black uppercase tracking-wide text-blue-100 mb-2">{item?.name || '未知法条'}</h4>
                            <p className="text-sm leading-relaxed text-blue-50 font-medium">{item?.content || '内容缺失'}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
                      <div className="flex items-center gap-4 mb-8">
                        <Landmark size={24} className="text-slate-400" />
                        <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">参考类案分析</h3>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-6">
                        {(result.caseLaw || []).map((item, i) => (
                          <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="flex justify-between mb-3">
                              <h4 className="text-sm font-black text-slate-800 line-clamp-2">{item?.title || '未知案件'}</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 mb-6 flex-grow leading-relaxed">{item?.summary || '无摘要内容'}</p>
                            <div className="mt-auto pt-4 border-t border-slate-200 flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-400">{item?.court || '法院未知'} | {item?.year || '年份未知'}</span>
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-1 rounded">判决：{item?.outcome || '结果缺失'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bragging' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in">
              <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-200">
                <div className="flex flex-col items-center text-center mb-10">
                  <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mb-6">
                    <Megaphone className="text-amber-600" size={36} />
                  </div>
                  <h3 className="font-black text-2xl mb-2">群吹牛/专业回复生成器</h3>
                  <p className="text-slate-400 text-xs tracking-widest uppercase font-bold">Showcase Professionalism with Style</p>
                </div>

                <div className="space-y-8">
                  <div className="flex flex-wrap gap-3 justify-center">
                    {['随机', '高冷', '穷嗨', '专业', '苦逼', '妖娆', '回复'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setBragStyle(style)}
                        className={`px-6 py-3 rounded-full font-black text-sm transition-all border ${
                          bragStyle === style 
                          ? 'bg-slate-900 text-white border-transparent shadow-lg scale-105' 
                          : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>

                  {bragStyle === '回复' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">对方说了什么？</label>
                      <textarea
                        className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none text-sm leading-relaxed transition-all resize-none h-32"
                        placeholder="粘贴对方在群里发的问题，我帮你秒回..."
                        value={bragContext}
                        onChange={(e) => setBragContext(e.target.value)}
                      />
                    </div>
                  )}

                  <button
                    onClick={handleGenerateBrag}
                    disabled={isBragLoading}
                    className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-100 hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {isBragLoading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                    {isBragLoading ? 'AI 正在润色...' : '立即生成 5 条话术'}
                  </button>
                </div>
              </div>

              {bragResults.length > 0 && (
                <div className="space-y-4 animate-in">
                  <div className="flex items-center gap-2 px-6">
                    <Coffee size={16} className="text-amber-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">生成结果（点击一键复制）</span>
                  </div>
                  {bragResults.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        navigator.clipboard.writeText(item);
                        alert("已复制到剪贴板！");
                      }}
                      className="group bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Copy size={16} className="text-blue-600" />
                      </div>
                      <p className="text-base font-bold text-slate-800 leading-relaxed group-hover:text-blue-700">{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && devMode && (
            <div className="max-w-xl mx-auto space-y-8 pt-10 animate-in">
              <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-200">
                <div className="flex flex-col items-center text-center mb-10">
                  <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-6">
                    <Key className="text-blue-600" size={36} />
                  </div>
                  <h3 className="font-black text-xl mb-2">开发者控制台</h3>
                  <p className="text-slate-400 text-xs tracking-widest uppercase">DeepSeek API Configuration</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Override API Key</label>
                    <input 
                      type="password"
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none text-sm font-mono transition-all"
                      placeholder="留空则使用内置 KEY"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        localStorage.setItem('DEEPSEEK_API_KEY', e.target.value);
                      }}
                    />
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <span className="text-amber-600 shrink-0"><Info size={18} /></span>
                    <p className="text-[10px] text-amber-800 leading-relaxed font-medium">注意：修改 Key 后建议清除缓存并重新运行。直接双击 HTML 运行时，请确保浏览器允许跨域请求或已安装相关插件。</p>
                  </div>
                  <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-5 text-rose-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 rounded-2xl transition-all active:scale-95">
                    <Trash2 size={16} /> 彻底清除全部缓存并重启
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes fade-in { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
    {icon} {label}
  </button>
);

export default App;
