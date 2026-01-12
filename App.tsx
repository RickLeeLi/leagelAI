
import React, { useState, useEffect } from 'react';
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
  ArrowRight
} from 'lucide-react';

const App: React.FC = () => {
  const [caseInfo, setCaseInfo] = useState('');
  const [claims, setClaims] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'result' | 'settings'>('input');
  const [apiKey, setApiKey] = useState(localStorage.getItem('DEEPSEEK_API_KEY') || '');

  useEffect(() => {
    const saved = localStorage.getItem('legal_case_web_draft');
    if (saved) {
      try {
        const { caseInfo, claims } = JSON.parse(saved);
        setCaseInfo(caseInfo);
        setClaims(claims);
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
    if (!apiKey) {
      alert('请先在设置页面配置您的 DeepSeek API Key');
      setActiveTab('settings');
      return;
    }
    if (!caseInfo.trim() || !claims.trim()) {
      alert('请完整填写案情事实和诉讼请求');
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await analyzeLitigationData({ caseInfo, claims, evidenceFiles: [] });
      setResult(data);
      localStorage.setItem('legal_analysis_result', JSON.stringify(data));
      setActiveTab('result');
    } catch (error: any) {
      alert(error.message);
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
    alert('报告已成功复制到剪贴板 (Markdown 格式)');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar - Desktop */}
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
          <NavBtn active={activeTab === 'input'} onClick={() => setActiveTab('input')} icon={<FileSearch size={18} />} label="案情录入" />
          <NavBtn active={activeTab === 'result'} onClick={() => setActiveTab('result')} icon={<LayoutDashboard size={18} />} label="分析报告" />
          <NavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="系统配置" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="p-4 bg-slate-800/50 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={12} className="text-blue-400" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Cloud Node</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">部署于 Cloudflare Pages 全球边缘网络，国内直连响应。</p>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-grow flex flex-col min-w-0 pb-20 md:pb-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 md:static">
          <div className="flex items-center gap-3 md:hidden">
            <Scale className="text-blue-600" size={20} />
            <h1 className="font-black text-sm uppercase tracking-widest">Litigation Pro</h1>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            <span>Workflow</span>
            <ArrowRight size={10} />
            <span className="text-slate-900">{activeTab === 'input' ? 'Entry' : activeTab === 'result' ? 'Report' : 'Settings'}</span>
          </div>
          <div className="flex items-center gap-3">
             {result && activeTab === 'result' && (
               <button onClick={copyReportAsMarkdown} className="flex items-center gap-2 text-[10px] font-black bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-all">
                 <Copy size={12} /> 导出分析报告
               </button>
             )}
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
          {activeTab === 'input' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-blue-600" />
                  </div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">案情基本事实</label>
                </div>
                <textarea 
                  className="w-full h-72 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none text-sm leading-[1.8] transition-all resize-none font-medium"
                  placeholder="请输入案件经过，包含时间、地点、人物及争议点。例如：2023年3月，我方通过微信向被告订购了一批电子元件，约定货到付款，但被告至今未履行..."
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
                  placeholder="例如：判令被告向原告支付货款5万元及利息..."
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
                {isLoading ? 'DEEPSEEK 正在进行法理逻辑分析...' : '提交 AI 进行专业证据矩阵分析'}
              </button>
            </div>
          )}

          {activeTab === 'result' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-20">
              {!result ? (
                <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-200 flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <FileSearch size={40} className="text-slate-200" />
                  </div>
                  <h3 className="text-slate-800 font-black text-xl mb-2">等待数据录入</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">请先在“案情录入”页面描述您的案件详情，点击分析按钮后此处将呈现报告</p>
                </div>
              ) : (
                <>
                  <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-10 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Layers size={20} className="text-blue-600" />
                        <h3 className="font-black text-sm uppercase tracking-widest">证据项与待证事实</h3>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">AI 推理引擎 v3.0</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th className="px-10 py-5">证据项名称</th>
                            <th className="px-10 py-5">证明对象 (拟证明事实)</th>
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
                                  {item.reliability === 'High' ? '强证明力' : item.reliability === 'Medium' ? '中等' : '需补强'}
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
                        <h3 className="font-black text-sm uppercase tracking-widest">证据链补强建议</h3>
                      </div>
                      <div className="space-y-8">
                        {result.reinforcement.map((item, i) => (
                          <div key={i} className="group border-l-4 border-slate-100 pl-6 py-1 hover:border-blue-400 transition-all">
                            <h4 className="text-sm font-black text-slate-800 mb-2">{item.gap}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">建议操作：{item.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                          <AlertTriangle size={22} className="text-rose-500" />
                        </div>
                        <h3 className="font-black text-sm uppercase tracking-widest">诉讼法律风险</h3>
                      </div>
                      <div className="space-y-6">
                        {result.risks.map((item, i) => (
                          <div key={i} className="bg-rose-50/20 p-6 rounded-3xl border border-rose-100/50">
                            <h4 className="text-xs font-black text-rose-700 mb-2 uppercase tracking-wide">风险：{item.riskPoint}</h4>
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
                      <h3 className="font-black text-sm uppercase tracking-widest">相似类案与裁判逻辑参考</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      {result.caseLaw.map((item, i) => (
                        <div key={i} className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 hover:bg-slate-800 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-black text-blue-400">{item.title}</h4>
                            <span className="text-[9px] font-black uppercase text-slate-500">{item.year}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">{item.summary}</p>
                          <div className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded inline-block">结果：{item.outcome}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pt-10">
              <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-200">
                <div className="flex flex-col items-center text-center mb-10">
                  <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-6">
                    <ShieldCheck className="text-blue-600" size={36} />
                  </div>
                  <h3 className="font-black text-xl mb-2">安全与配置</h3>
                  <p className="text-slate-400 text-xs">您的数据通过加密协议传输，API Key 仅本地存储。</p>
                </div>
                
                <div className="space-y-8">
                  <div className="relative group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">DeepSeek API Key</label>
                    <input 
                      type="password"
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none text-sm font-mono transition-all"
                      placeholder="输入您的 sk-..."
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        localStorage.setItem('DEEPSEEK_API_KEY', e.target.value);
                      }}
                    />
                    <Key className="absolute right-6 top-11 text-slate-300 group-focus-within:text-blue-400 transition-colors" size={20} />
                  </div>

                  <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex gap-4">
                    <Globe className="text-blue-500 shrink-0" size={20} />
                    <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                      当前版本已针对 **Cloudflare Pages** 进行优化。无需域名备案即可在国内稳定使用。如需更换 DeepSeek 模型，请在 API 配置中进行调整。
                    </p>
                  </div>

                  <button 
                    onClick={() => { if(confirm('确定要清除所有录入数据和设置吗？')) { localStorage.clear(); window.location.reload(); }}}
                    className="w-full py-5 text-rose-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 rounded-2xl transition-all"
                  >
                    <Trash2 size={16} /> 重置所有本地数据
                  </button>
                </div>
              </div>

              <div className="flex justify-center gap-6">
                 <a href="https://platform.deepseek.com/" target="_blank" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 flex items-center gap-1">获取 API Key <ExternalLink size={10}/></a>
                 <a href="https://pages.cloudflare.com/" target="_blank" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 flex items-center gap-1">托管说明 <ExternalLink size={10}/></a>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar - Mobile */}
        <nav className="fixed bottom-0 inset-x-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-50 md:hidden px-6">
          <MobileNavBtn active={activeTab === 'input'} onClick={() => setActiveTab('input')} icon={<FileSearch size={22} />} label="录入" />
          <MobileNavBtn active={activeTab === 'result'} onClick={() => setActiveTab('result')} icon={<LayoutDashboard size={22} />} label="报告" />
          <MobileNavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={22} />} label="设置" />
        </nav>
      </main>

      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-in { animation: fade-in 0.5s ease-out; }
      `}</style>
    </div>
  );
};

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${
      active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    {icon} {label}
  </button>
);

const MobileNavBtn = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${
      active ? 'text-blue-600' : 'text-slate-300'
    }`}
  >
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
