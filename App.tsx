
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, CaseInput } from './types';
import { analyzeLitigationData } from './services/legalService';
import { 
  FileText, 
  Layers, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Gavel,
  Loader2,
  ShieldCheck,
  Scale,
  Trash2,
  Key,
  Zap,
  Copy,
  LayoutDashboard,
  FileSearch,
  Globe,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

const App: React.FC = () => {
  const [caseInfo, setCaseInfo] = useState('');
  const [claims, setClaims] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'settings'>('input');
  const [apiKey, setApiKey] = useState(localStorage.getItem('DEEPSEEK_API_KEY') || '');
  const resultRef = useRef<HTMLDivElement>(null);

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
        setResult(JSON.parse(savedResult));
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('legal_case_web_draft', JSON.stringify({ caseInfo, claims }));
  }, [caseInfo, claims]);

  const handleAnalyze = async () => {
    setError(null);
    if (!apiKey) {
      setError('请先在“系统配置”中设置您的 DeepSeek API Key');
      setActiveTab('settings');
      return;
    }
    if (!caseInfo.trim() || !claims.trim()) {
      setError('请完整填写案情事实和诉讼请求');
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await analyzeLitigationData({ caseInfo, claims, evidenceFiles: [] });
      setResult(data);
      localStorage.setItem('legal_analysis_result', JSON.stringify(data));
      
      // 延迟滚动确保 DOM 已渲染
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err: any) {
      setError(err.message || '分析过程中发生未知错误');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReportAsMarkdown = () => {
    if (!result) return;
    let md = `# 诉讼证据矩阵分析报告\n\n生成时间: ${new Date().toLocaleString()}\n\n## 1. 证据清单与事实矩阵\n`;
    result.evidenceList.forEach(item => {
      md += `- **[${item.reliability === 'High' ? '强' : '需补强'}] ${item.name}**: ${item.provedFact}\n`;
    });
    md += `\n## 2. 证据补强建议\n`;
    result.reinforcement.forEach(item => {
      md += `- **缺口**: ${item.gap}\n  * **建议**: ${item.suggestion}\n`;
    });
    md += `\n## 3. 诉讼风险评估\n`;
    result.risks.forEach(item => {
      md += `- **风险**: ${item.riskPoint}\n  * **详情**: ${item.description}\n  * **对策**: ${item.mitigation}\n`;
    });
    md += `\n## 4. 参考类案摘要\n`;
    result.caseLaw.forEach(item => {
      md += `- **${item.title}** (${item.court}, ${item.year})\n  * 裁判要旨: ${item.summary}\n`;
    });

    navigator.clipboard.writeText(md);
    alert('报告已成功复制到剪贴板');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 flex-col sticky top-0 h-screen p-6 text-white shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="font-black tracking-tighter text-lg leading-none">Litigation</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Matrix Pro</p>
          </div>
        </div>

        <nav className="flex-grow space-y-2">
          <NavBtn active={activeTab === 'input'} onClick={() => setActiveTab('input')} icon={<FileSearch size={18} />} label="工作台" />
          <NavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="系统配置" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="p-4 bg-slate-800/50 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={12} className="text-blue-400" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Global Proxy</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">代理网关：deepseek-proxy.wxxcxzhuanyong.workers.dev</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0 pb-20 md:pb-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 md:static">
          <div className="flex items-center gap-3 md:hidden">
            <Scale className="text-blue-600" size={20} />
            <h1 className="font-black text-sm uppercase tracking-widest">Litigation Pro</h1>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            <span>Workflow</span>
            <ArrowRight size={10} />
            <span className="text-slate-900">{activeTab === 'input' ? 'Analysis Workbench' : 'Settings'}</span>
          </div>
          <div className="flex items-center gap-3">
             {result && activeTab === 'input' && (
               <button onClick={copyReportAsMarkdown} className="flex items-center gap-2 text-[10px] font-black bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-all">
                 <Copy size={12} /> 复制报告
               </button>
             )}
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
          {activeTab === 'input' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Error Message Area */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl flex items-start gap-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="text-rose-600" size={20} />
                  </div>
                  <div>
                    <h4 className="text-rose-900 font-black text-sm uppercase tracking-widest mb-1">请求执行失败</h4>
                    <p className="text-rose-700 text-xs font-medium leading-relaxed">{error}</p>
                    <div className="mt-3 flex gap-4">
                      <button onClick={handleAnalyze} className="text-[10px] font-black text-rose-800 underline uppercase tracking-widest hover:text-rose-600">重试请求</button>
                      <button onClick={() => setActiveTab('settings')} className="text-[10px] font-black text-rose-800 underline uppercase tracking-widest hover:text-rose-600">检查配置</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-blue-600" />
                  </div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">案情基本事实</label>
                </div>
                <textarea 
                  className="w-full h-64 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none text-sm leading-[1.8] transition-all resize-none font-medium"
                  placeholder="请输入案件经过..."
                  value={caseInfo}
                  onChange={(e) => setCaseInfo(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Gavel size={16} className="text-blue-600" />
                  </div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">诉讼请求</label>
                </div>
                <textarea 
                  className="w-full h-24 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none text-sm leading-relaxed transition-all resize-none font-medium"
                  placeholder="例如：判令被告支付货款..."
                  value={claims}
                  onChange={(e) => setClaims(e.target.value)}
                />
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-base shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none"
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                {isLoading ? '正在进行法律逻辑推理...' : '生成证据矩阵报告'}
              </button>

              {/* Analysis Result Display */}
              {result && (
                <div ref={resultRef} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 border-t border-slate-200 pt-12">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="text-amber-500" size={24} />
                    <h2 className="text-2xl font-black tracking-tight text-slate-800">深度法律分析报告</h2>
                  </div>

                  <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-10 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Layers size={20} className="text-blue-600" />
                        <h3 className="font-black text-sm uppercase tracking-widest">证据项与待证事实矩阵</h3>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th className="px-10 py-5">证据项名称</th>
                            <th className="px-10 py-5">拟证明事实</th>
                            <th className="px-10 py-5 text-center">证明力</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {result.evidenceList.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-10 py-6 font-bold text-slate-800 text-sm">{item.name}</td>
                              <td className="px-10 py-6 text-slate-600 text-sm leading-relaxed">{item.provedFact}</td>
                              <td className="px-10 py-6 text-center">
                                <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  item.reliability === 'High' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                  item.reliability === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                  {item.reliability === 'High' ? '强' : item.reliability === 'Medium' ? '中' : '弱'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <div className="grid md:grid-cols-2 gap-8">
                    <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                          <CheckCircle size={22} className="text-emerald-500" />
                        </div>
                        <h3 className="font-black text-sm uppercase tracking-widest">补强建议</h3>
                      </div>
                      <div className="space-y-8">
                        {result.reinforcement.map((item, i) => (
                          <div key={i} className="group border-l-4 border-slate-100 pl-6 py-1 hover:border-blue-400 transition-all">
                            <h4 className="text-sm font-black text-slate-800 mb-2">{item.gap}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                          <AlertTriangle size={22} className="text-rose-500" />
                        </div>
                        <h3 className="font-black text-sm uppercase tracking-widest">诉讼风险</h3>
                      </div>
                      <div className="space-y-6">
                        {result.risks.map((item, i) => (
                          <div key={i} className="bg-rose-50/20 p-6 rounded-3xl border border-rose-100/50">
                            <h4 className="text-xs font-black text-rose-700 mb-2 uppercase tracking-wide">{item.riskPoint}</h4>
                            <p className="text-xs text-slate-600 mb-4 leading-relaxed">{item.description}</p>
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-rose-100/50">
                              <ShieldCheck size={12} className="text-blue-600" />
                              <p className="text-[11px] text-blue-700 font-bold">{item.mitigation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <section className="bg-slate-900 rounded-[2.5rem] shadow-xl p-10 text-white">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <BookOpen size={20} />
                      </div>
                      <h3 className="font-black text-sm uppercase tracking-widest">相似类案与裁判参考</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      {result.caseLaw.map((item, i) => (
                        <div key={i} className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 hover:bg-slate-800 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-black text-blue-400 leading-tight pr-4">{item.title}</h4>
                            <span className="text-[9px] font-black uppercase text-slate-500 shrink-0">{item.year}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed mb-4 line-clamp-3">{item.summary}</p>
                          <div className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded inline-block">结果：{item.outcome}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pt-10">
              <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-200">
                <div className="flex flex-col items-center text-center mb-10">
                  <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-6">
                    <Key className="text-blue-600" size={36} />
                  </div>
                  <h3 className="font-black text-xl mb-2">服务接入配置</h3>
                  <p className="text-slate-400 text-xs">通过私有代理网关安全访问 DeepSeek 模型</p>
                </div>
                
                <div className="space-y-8">
                  <div className="relative group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">DeepSeek API Key</label>
                    <input 
                      type="password"
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none text-sm font-mono transition-all"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        localStorage.setItem('DEEPSEEK_API_KEY', e.target.value);
                      }}
                    />
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex gap-4">
                    <Info className="text-slate-400 shrink-0" size={20} />
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        当前使用代理：<br/><code className="text-blue-600">deepseek-proxy.wxxcxzhuanyong.workers.dev</code>
                      </p>
                      <p className="text-[10px] text-slate-400">若点击提交无响应，请按下 F12 查看 Console 控制台是否有报错。</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => { if(confirm('重置将清除所有录入数据？')) { localStorage.clear(); window.location.reload(); }}}
                    className="w-full py-5 text-rose-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 rounded-2xl transition-all"
                  >
                    <Trash2 size={16} /> 重置本地所有数据
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar Mobile */}
        <nav className="fixed bottom-0 inset-x-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-50 md:hidden px-6">
          <MobileNavBtn active={activeTab === 'input'} onClick={() => setActiveTab('input')} icon={<LayoutDashboard size={22} />} label="工作台" />
          <MobileNavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={22} />} label="设置" />
        </nav>
      </main>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
    {icon} {label}
  </button>
);

const MobileNavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-600' : 'text-slate-300'}`}>
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
