
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
  BookOpen,
  ArrowRight,
  Sparkles,
  Info,
  Lock,
  Unlock
} from 'lucide-react';

const App: React.FC = () => {
  const [caseInfo, setCaseInfo] = useState('');
  const [claims, setClaims] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'settings'>('input');
  const [apiKey, setApiKey] = useState(localStorage.getItem('DEEPSEEK_API_KEY') || '');
  
  // 开发者模式状态
  const [devMode, setDevMode] = useState(localStorage.getItem('DEV_MODE') === 'true');
  const [logoClicks, setLogoClicks] = useState(0);
  
  const resultRef = useRef<HTMLDivElement>(null);

  // 连击逻辑：侧边栏Logo连击5次开启/关闭配置
  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    if (newCount >= 5) {
      const targetMode = !devMode;
      setDevMode(targetMode);
      setLogoClicks(0);
      localStorage.setItem('DEV_MODE', String(targetMode));
      alert(targetMode ? "开发者模式已开启，设置入口已激活" : "开发者模式已关闭");
    } else {
      setLogoClicks(newCount);
      // 3秒内不连击则重置
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

  const copyReportAsMarkdown = () => {
    if (!result) return;
    let md = `# 诉讼证据矩阵分析报告\n\n生成时间: ${new Date().toLocaleString()}\n\n## 1. 证据清单\n`;
    result.evidenceList.forEach(item => {
      md += `- **${item.name}**: ${item.provedFact}\n`;
    });
    navigator.clipboard.writeText(md);
    alert('报告已成功复制');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 flex-col sticky top-0 h-screen p-6 text-white shrink-0">
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-3 mb-10 cursor-pointer select-none group active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50 group-hover:bg-blue-500">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="font-black tracking-tighter text-lg leading-none">Litigation</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Matrix Pro</p>
          </div>
        </div>

        <nav className="flex-grow space-y-2">
          <NavBtn active={activeTab === 'input'} onClick={() => setActiveTab('input')} icon={<FileSearch size={18} />} label="工作台" />
          {devMode && (
            <NavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="系统配置" />
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="p-4 bg-slate-800/50 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Status</span>
              <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck size={10} /> 官方接口连接
              </p>
            </div>
            {devMode ? <Unlock size={14} className="text-blue-400" /> : <Lock size={14} className="text-slate-600" />}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0 pb-20 md:pb-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 md:static">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            <span>Workflow</span>
            <ArrowRight size={10} />
            <span className="text-slate-900">{activeTab === 'input' ? 'Analysis Workbench' : 'Dev Settings'}</span>
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
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              {error && (
                <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl flex items-start gap-4">
                  <AlertTriangle className="text-rose-600 shrink-0" size={20} />
                  <div>
                    <h4 className="text-rose-900 font-black text-sm uppercase mb-1">分析中断</h4>
                    <p className="text-rose-700 text-xs font-medium">{error}</p>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <FileText size={16} className="text-blue-600" />
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">案情基本事实</label>
                </div>
                <textarea 
                  className="w-full h-64 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none text-sm leading-[1.8] transition-all resize-none"
                  placeholder="请输入案件经过..."
                  value={caseInfo}
                  onChange={(e) => setCaseInfo(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <Gavel size={16} className="text-blue-600" />
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">诉讼请求</label>
                </div>
                <textarea 
                  className="w-full h-24 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none text-sm transition-all resize-none"
                  placeholder="例如：请求判令被告支付货款..."
                  value={claims}
                  onChange={(e) => setClaims(e.target.value)}
                />
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-base shadow-2xl shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                {isLoading ? '正在进行法律逻辑推理...' : '生成证据矩阵报告'}
              </button>

              {result && (
                <div ref={resultRef} className="space-y-10 pt-12">
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-amber-500" size={24} />
                    <h2 className="text-2xl font-black text-slate-800">深度法律分析报告</h2>
                  </div>
                  {/* ... 结果渲染逻辑保持与之前一致 ... */}
                  <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200">
                    <h3 className="text-sm font-black uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-2">
                       <Layers size={18} className="text-blue-600"/> 证据项分析
                    </h3>
                    <div className="space-y-4">
                      {result.evidenceList.map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div>
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{item.provedFact}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                            item.reliability === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>{item.reliability === 'High' ? '强证明力' : '需补强'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && devMode && (
            <div className="max-w-xl mx-auto space-y-8 pt-10">
              <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-200">
                <div className="flex flex-col items-center text-center mb-10">
                  <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-6">
                    <Key className="text-blue-600" size={36} />
                  </div>
                  <h3 className="font-black text-xl mb-2">开发者控制台</h3>
                  <p className="text-slate-400 text-xs">手动覆盖 API 配置，更改后立即生效</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Override API Key</label>
                    <input 
                      type="password"
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none text-sm font-mono transition-all"
                      placeholder="留空则使用代码内置 Key"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        localStorage.setItem('DEEPSEEK_API_KEY', e.target.value);
                      }}
                    />
                  </div>

                  <div className="p-6 bg-blue-50 rounded-3xl flex gap-4">
                    <Info className="text-blue-600 shrink-0" size={20} />
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                      <b>如何将 Key 写死在代码中？</b><br/>
                      1. 打开控制台输入 `btoa("你的sk-key")`<br/>
                      2. 将结果填入 `legalService.ts` 的 `EMBEDDED_KEY_B64` 变量中。<br/>
                      3. 普通用户即便不录入 Key 也能直接使用。
                    </p>
                  </div>

                  <button 
                    onClick={() => { localStorage.clear(); window.location.reload(); }}
                    className="w-full py-5 text-rose-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 rounded-2xl transition-all"
                  >
                    <Trash2 size={16} /> 彻底清除所有缓存
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
    {icon} {label}
  </button>
);

export default App;
