
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, CaseInput } from './types';
import { analyzeLitigationData } from './services/legalService';
import { 
  FileText, Layers, Settings, CheckCircle, AlertTriangle, Gavel, 
  Loader2, ShieldCheck, Scale, Trash2, Key, Zap, Copy, FileSearch, 
  BookOpen, ArrowRight, Sparkles, Info, Lock, Unlock, ShieldAlert,
  Sword, BookMarked, MessageSquareText, Landmark
} from 'lucide-react';

const App: React.FC = () => {
  const [caseInfo, setCaseInfo] = useState('');
  const [claims, setClaims] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'settings'>('input');
  const [apiKey, setApiKey] = useState(localStorage.getItem('DEEPSEEK_API_KEY') || '');
  const [devMode, setDevMode] = useState(localStorage.getItem('DEV_MODE') === 'true');
  const [logoClicks, setLogoClicks] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

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
      try { setResult(JSON.parse(savedResult)); } catch(e) {}
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

  const copyReport = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    alert('结构化报告已复制');
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
          {devMode && <NavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="系统配置" />}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="p-4 bg-slate-800/50 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DeepSeek Official</span>
              <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><ShieldCheck size={10} /> 加密安全通道</p>
            </div>
            {devMode ? <Unlock size={14} className="text-blue-400" /> : <Lock size={14} className="text-slate-600" />}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            <span>Legal Analysis</span>
            <ArrowRight size={10} />
            <span className="text-slate-900">{activeTab === 'input' ? 'Workbench' : 'Settings'}</span>
          </div>
          <div className="flex items-center gap-3">
             {result && activeTab === 'input' && (
               <button onClick={copyReport} className="flex items-center gap-2 text-[10px] font-black bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-all active:scale-95">
                 <Copy size={12} /> 复制报告
               </button>
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
                      placeholder="请详尽输入案件事实经过..."
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
                      placeholder="判令被告支付..."
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
                <div ref={resultRef} className="space-y-10 pt-12 animate-in">
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-amber-500" size={28} />
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">结构化法律分析报告</h2>
                  </div>

                  {/* 核心诉讼策略 */}
                  <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none"></div>
                    <div className="flex items-center gap-4 mb-6 relative">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <ShieldCheck size={24} />
                      </div>
                      <h3 className="text-lg font-black uppercase tracking-widest">核心诉讼方案</h3>
                    </div>
                    <p className="text-lg leading-relaxed text-blue-50/90 font-medium">{result.strategy}</p>
                  </div>

                  {/* 证据矩阵 */}
                  <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
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
                          {result.evidenceList.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-10 py-6 font-bold text-slate-800 text-sm">{item.name}</td>
                              <td className="px-10 py-6 text-slate-600 text-sm leading-relaxed">{item.provedFact}</td>
                              <td className="px-10 py-6 text-center">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                                  item.reliability === 'High' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {item.reliability === 'High' ? '强' : '中/弱'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* 关键争议点 */}
                    <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          <MessageSquareText size={22} className="text-blue-600" />
                        </div>
                        <h3 className="font-black text-sm uppercase tracking-widest">关键争议点</h3>
                      </div>
                      <div className="space-y-4">
                        {result.keyPoints.map((point, i) => (
                          <div key={i} className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl group hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-blue-100">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600 shrink-0">{i+1}</div>
                            <p className="text-sm font-bold text-slate-700">{point}</p>
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
                        <h3 className="font-black text-sm uppercase tracking-widest">诉讼风险预警</h3>
                      </div>
                      <div className="space-y-4">
                        {result.risks.map((risk, i) => (
                          <div key={i} className="p-6 bg-rose-50/30 rounded-3xl border border-rose-100/50">
                            <h4 className="text-sm font-black text-rose-800 mb-2">{risk.riskPoint}</h4>
                            <p className="text-xs text-slate-500 mb-4">{risk.description}</p>
                            <div className="bg-white px-3 py-2 rounded-xl text-[10px] font-black text-blue-600 inline-flex items-center gap-2 border border-blue-50">
                              <CheckCircle size={10} /> {risk.mitigation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* 模拟对抗 */}
                  <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Sword size={22} className="text-amber-600" />
                      </div>
                      <h3 className="font-black text-sm uppercase tracking-widest">模拟法庭对抗</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                      {result.confrontation.map((item, i) => (
                        <div key={i} className="space-y-4">
                          <div className="p-6 bg-slate-900 text-white rounded-[2rem] relative">
                            <span className="absolute -top-3 left-6 px-3 py-1 bg-rose-500 text-[10px] font-black uppercase rounded-full">对方辩称</span>
                            <p className="text-sm font-medium opacity-90">{item.opponentArgument}</p>
                          </div>
                          <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 relative">
                            <span className="absolute -top-3 left-6 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-full text-center">反击方案</span>
                            <p className="text-sm font-bold text-emerald-900">{item.counterStrategy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 法律条文与案例 */}
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-xl">
                      <div className="flex items-center gap-4 mb-8">
                        <BookMarked size={24} />
                        <h3 className="font-black text-sm uppercase tracking-widest">相关法律条文</h3>
                      </div>
                      <div className="space-y-8">
                        {result.statutes.map((item, i) => (
                          <div key={i} className="border-l-2 border-blue-400 pl-4">
                            <h4 className="text-xs font-black uppercase tracking-wide text-blue-200 mb-2">{item.name}</h4>
                            <p className="text-sm leading-relaxed text-blue-50 font-medium">{item.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
                      <div className="flex items-center gap-4 mb-8">
                        <Landmark size={24} className="text-slate-400" />
                        <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">相似类案参考</h3>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-6">
                        {result.caseLaw.map((item, i) => (
                          <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col h-full">
                            <div className="flex justify-between mb-3">
                              <h4 className="text-sm font-black text-slate-800 line-clamp-2">{item.title}</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 mb-6 flex-grow leading-relaxed">{item.summary}</p>
                            <div className="mt-auto pt-4 border-t border-slate-200 flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-400">{item.court} | {item.year}</span>
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">结果：{item.outcome}</span>
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
                  <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-5 text-rose-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 rounded-2xl transition-all active:scale-95">
                    <Trash2 size={16} /> 清除全部缓存并重启
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
