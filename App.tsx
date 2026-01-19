
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, CaseInput, TabType, EvidenceItem } from './types';
import { analyzeLitigationData, generateBraggingContent } from './services/legalService';
import { 
  Scale, Zap, Loader2, Download, RefreshCw, Megaphone, Plus, X, 
  FileType, MapPin, Shield, LayoutDashboard, Sparkles, Menu
} from 'lucide-react';

const App: React.FC = () => {
  const [caseInfo, setCaseInfo] = useState('');
  const [claims, setClaims] = useState('');
  const [plaintiffLoc, setPlaintiffLoc] = useState('');
  const [defendantLoc, setDefendantLoc] = useState('');
  const [mySide, setMySide] = useState<'plaintiff' | 'defendant'>('plaintiff');
  const [strategyFocus, setStrategyFocus] = useState<string[]>(['win_rate']);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('strategy');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [bragStyle, setBragStyle] = useState('随机');
  const [bragContext, setBragContext] = useState('');
  const [bragResults, setBragResults] = useState<string[]>([]);
  const [isBragLoading, setIsBragLoading] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!caseInfo.trim() && evidenceList.length === 0) {
      alert("请录入案情或上传证据");
      return;
    }
    setIsLoading(true);
    try {
      const data = await analyzeLitigationData({ 
        caseInfo, claims, plaintiffLoc, defendantLoc, mySide, strategyFocus, evidenceFiles: evidenceList 
      });
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEvidenceList(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: (file.size / 1024).toFixed(1) + ' KB',
          provedFact: '',
          reliability: 'Medium'
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full p-6 text-white">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><Scale size={24} /></div>
        <div>
          <h1 className="font-black text-lg leading-none">诉棍快乐屋</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">专业诉讼审计系统</p>
        </div>
      </div>
      <nav className="flex-grow space-y-2">
        <NavBtn active={activeTab === 'strategy'} onClick={() => {setActiveTab('strategy'); setIsSidebarOpen(false);}} icon={<LayoutDashboard size={18} />} label="实操方案生成" />
        <NavBtn active={activeTab === 'matrix'} onClick={() => {setActiveTab('matrix'); setIsSidebarOpen(false);}} icon={<Shield size={18} />} label="证据矩阵审计" />
        <NavBtn active={activeTab === 'bragging'} onClick={() => {setActiveTab('bragging'); setIsSidebarOpen(false);}} icon={<Megaphone size={18} />} label="装逼神器" />
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex font-sans text-slate-900 overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[60] md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static w-64 bg-slate-900 z-[70] transition-transform duration-300 ease-in-out shrink-0`}>
        <SidebarContent />
      </aside>

      <main className="flex-grow flex flex-col min-w-0 w-full">
        <header className="h-20 bg-white border-b px-4 md:px-8 flex items-center justify-between sticky top-0 z-50 print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-600"><Menu size={24} /></button>
            <h2 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest truncate">
              {activeTab === 'strategy' ? '法律服务方案审计' : activeTab === 'matrix' ? '证据矩阵审计' : '社交影响力工具'}
            </h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setResult(null)} className="p-2 text-slate-400 hover:text-rose-500"><RefreshCw size={18} /></button>
            {result && <button onClick={() => window.print()} className="bg-slate-900 text-white px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-black flex items-center gap-2 shrink-0"><Download size={14} /> 打印文档</button>}
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6 md:space-y-8 print:p-0">
          {activeTab === 'strategy' && (
            <div className="space-y-6 animate-in print:space-y-0">
              <div className="grid lg:grid-cols-12 gap-6 print:hidden">
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6 border">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block">案情事实背景</label>
                    <textarea className="w-full p-4 bg-slate-50 rounded-xl outline-none text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500" placeholder="录入案情..." value={caseInfo} onChange={e => setCaseInfo(e.target.value)} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-5 md:p-6 border">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block">原告所在地</label>
                      <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl"><MapPin size={16} /><input className="bg-transparent outline-none text-sm w-full" value={plaintiffLoc} onChange={e => setPlaintiffLoc(e.target.value)} /></div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 md:p-6 border">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block">被告所在地</label>
                      <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl"><MapPin size={16} /><input className="bg-transparent outline-none text-sm w-full" value={defendantLoc} onChange={e => setDefendantLoc(e.target.value)} /></div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-4 space-y-6">
                   <div className="bg-white rounded-2xl p-5 md:p-6 border">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block">诉讼立场</label>
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                          <button onClick={() => setMySide('plaintiff')} className={`flex-1 py-2 text-xs font-black rounded-md ${mySide === 'plaintiff' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>原告方</button>
                          <button onClick={() => setMySide('defendant')} className={`flex-1 py-2 text-xs font-black rounded-md ${mySide === 'defendant' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>被告方</button>
                      </div>
                   </div>
                   <button onClick={handleAnalyze} disabled={isLoading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 disabled:bg-slate-300 flex items-center justify-center gap-2 transition-all">
                    {isLoading ? <Loader2 className="animate-spin" /> : <Zap size={20} />} 生成实操分析报告
                  </button>
                </div>
              </div>

              {result && (
                <div ref={resultRef} className="legal-document-container animate-in">
                  <div className="legal-page">
                    <h1 className="legal-title text-center font-black text-xl md:text-2xl tracking-widest border-b-2 border-black pb-4 mb-8">诉讼策略及证明要件分析报告</h1>
                    
                    <div className="legal-section">
                      <h2 className="legal-h1">一、 路径选择与管辖分析</h2>
                      {result.causeComparison.map((path, i) => (
                        <div key={i} className="legal-item mb-4 pl-0 md:pl-4">
                          <div className="font-bold">路径 {i + 1}：{path.pathName}</div>
                          <p className="legal-text">【管辖建议】 {path.jurisdiction}</p>
                          <p className="legal-text">【费用预估】 {path.costEstimate}</p>
                          <p className="legal-text">【优劣势分析】 优势：{path.pros}；风险：{path.cons}</p>
                        </div>
                      ))}
                    </div>

                    <div className="legal-section">
                      <h2 className="legal-h1">二、 诉讼执行方案</h2>
                      <div className="legal-text whitespace-pre-wrap pl-0 md:pl-4">{result.litigationPlan}</div>
                    </div>

                    <div className="legal-section">
                      <h2 className="legal-h1">三、 法律要件证明矩阵</h2>
                      {result.proofMatrix.map((m, i) => (
                        <div key={i} className="legal-item mb-4 pl-0 md:pl-4">
                          <div className="font-bold">{i + 1}. {m.elementName}（{m.status === 'success' ? '证据充分' : m.status === 'warning' ? '存在瑕疵' : '事实断裂'}）</div>
                          <p className="legal-text">现状：{m.analysis}</p>
                          <p className="legal-text text-blue-900 font-medium">建议：{m.fixSuggestion}</p>
                        </div>
                      ))}
                    </div>

                    <div className="legal-section">
                      <h2 className="legal-h1">四、 争议焦点预判</h2>
                      <div className="pl-0 md:pl-4">
                        {result.keyIssues.map((issue, i) => (
                          <p key={i} className="legal-text">{i + 1}. {issue}</p>
                        ))}
                      </div>
                    </div>

                    <div className="legal-section">
                      <h2 className="legal-h1">五、 红蓝对抗模拟</h2>
                      {result.combatCards.map((card, i) => (
                        <div key={i} className="legal-item mb-4 pl-0 md:pl-4 border-l-2 border-slate-200 ml-2">
                          <p className="legal-text"><strong>【对方抗辩】</strong> {card.opponentAttack}</p>
                          <p className="legal-text"><strong>【我方反驳】</strong> {card.counterLogic}</p>
                          <p className="legal-text text-slate-500 italic text-sm">依据：{card.supportingEvidence}</p>
                        </div>
                      ))}
                    </div>

                    <div className="legal-section">
                      <h2 className="legal-h1">六、 执业风险点与预案</h2>
                      {result.risks.map((r, i) => (
                        <div key={i} className="legal-item mb-2 pl-0 md:pl-4">
                          <p className="legal-text"><strong>风险点 {i + 1}：</strong>{r.point}</p>
                          <p className="legal-text"><strong>对策：</strong>{r.plan}</p>
                        </div>
                      ))}
                    </div>

                    <div className="legal-section">
                      <h2 className="legal-h1">七、 法条及实务依据</h2>
                      <div className="pl-0 md:pl-4 space-y-2">
                        {result.statutes.map((s, i) => (
                          <div key={i} className="legal-text text-sm leading-relaxed">
                            <strong>《{s.name}》</strong> {s.content}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="legal-section">
                      <h2 className="legal-h1">八、 可能的赔偿方案</h2>
                      <div className="pl-0 md:pl-4">
                        {result.compensationSchemes.map((scheme, i) => (
                          <p key={i} className="legal-text">{i + 1}. {scheme}</p>
                        ))}
                      </div>
                    </div>

                    <div className="legal-footer mt-auto pt-8 flex justify-between text-[10px] md:text-xs text-slate-400 border-t border-slate-100">
                      <span>报告日期：{new Date().toLocaleDateString()}</span>
                      <span>保密文档</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-6 animate-in">
               <div className="bg-white p-6 md:p-8 rounded-2xl border text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600"><FileType size={32} /></div>
                  <h3 className="text-xl font-black">证据矩阵静态审计</h3>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black hover:scale-105 transition-all w-full md:w-auto">上传证据文件</button>
                  <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileUpload} />
               </div>
               {evidenceList.length > 0 && (
                 <div className="bg-white rounded-2xl border overflow-hidden">
                    {evidenceList.map((e, i) => (
                      <div key={e.id} className="flex items-center gap-4 p-4 border-b last:border-0">
                         <FileType className="text-slate-300 shrink-0" />
                         <div className="flex-grow min-w-0">
                            <div className="text-sm font-bold truncate">{e.name}</div>
                            <input className="w-full text-xs text-blue-600 bg-transparent outline-none mt-1" placeholder="补充证明目的..." value={e.provedFact} onChange={v => {
                               const newList = [...evidenceList];
                               newList[i].provedFact = v.target.value;
                               setEvidenceList(newList);
                            }} />
                         </div>
                         <button onClick={() => setEvidenceList(l => l.filter(item => item.id !== e.id))} className="text-slate-300 hover:text-rose-500 p-2"><X size={16} /></button>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'bragging' && (
            <div className="max-w-2xl mx-auto space-y-6">
               <div className="bg-white p-6 md:p-10 rounded-[2rem] border shadow-sm text-center">
                  <Megaphone className="mx-auto text-amber-500 mb-6" size={48} />
                  <h3 className="text-2xl font-black mb-6">律师装逼工具</h3>
                  <div className="flex flex-wrap gap-2 justify-center mb-8">
                    {['随机', '高冷', '穷逼', '朋友圈', '回复'].map(s => (
                      <button key={s} onClick={() => { setBragStyle(s); if(s!=='回复') setBragContext(''); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${bragStyle === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{s}</button>
                    ))}
                  </div>
                  {bragStyle === '回复' && (
                    <div className="mb-6"><input className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="对方说了什么？" value={bragContext} onChange={e => setBragContext(e.target.value)} /></div>
                  )}
                  <button onClick={async () => {
                    setIsBragLoading(true);
                    try {
                      const res = await generateBraggingContent(bragStyle, bragContext);
                      setBragResults(res);
                    } catch(e) { alert("生成失败"); }
                    finally { setIsBragLoading(false); }
                  }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                    {isBragLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} 获取话术
                  </button>
               </div>
               <div className="space-y-4">
                  {bragResults.map((r, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border hover:border-blue-500 cursor-pointer transition-all" onClick={() => {navigator.clipboard.writeText(r); alert('已复制');}}>
                       <p className="text-slate-800 leading-relaxed text-sm font-medium">{r}</p>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .legal-document-container {
          background: #E2E8F0;
          padding: 20px;
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .legal-page {
          background: white;
          width: 100%;
          max-width: 210mm;
          min-height: 297mm;
          padding: 20mm 15mm;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          color: #000;
          font-family: "FangSong", "SimSun", serif;
          display: flex;
          flex-direction: column;
          line-height: 1.8;
          position: relative;
        }
        
        @media (max-width: 767px) {
          .legal-document-container {
            background: white !important;
            padding: 0 !important;
          }
          .legal-page {
            padding: 24px 16px !important;
            box-shadow: none !important;
            border: none !important;
            min-height: auto !important;
          }
          .legal-title {
            font-size: 1.25rem !important;
            margin-bottom: 1.5rem !important;
          }
          .legal-section {
            margin-bottom: 1.5rem !important;
          }
          .legal-h1 {
            font-size: 1.05rem !important;
          }
        }

        @media (min-width: 768px) {
          .legal-document-container { padding: 60px 20px; }
          .legal-page { padding: 30mm 25mm; }
        }

        .legal-title {
          font-family: "SimHei", sans-serif;
          margin-bottom: 2rem;
          line-height: 1.2;
        }
        .legal-section {
          margin-bottom: 2rem;
        }
        .legal-h1 {
          font-family: "SimHei", sans-serif;
          font-size: 1.1rem;
          font-weight: 900;
          margin-bottom: 1rem;
        }
        @media (min-width: 768px) {
          .legal-h1 { font-size: 1.2rem; }
        }
        .legal-text {
          font-size: 1rem;
          margin-bottom: 0.5rem;
          text-align: justify;
        }
        .legal-item {
          font-size: 1rem;
        }
        
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white;
            padding: 0;
          }
          main, .p-8, .p-4 {
            padding: 0 !important;
          }
          .legal-document-container {
            padding: 0 !important;
            background: white !important;
          }
          .legal-page {
            box-shadow: none !important;
            width: 100% !important;
            max-width: none !important;
            min-height: 297mm;
            padding: 25mm !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }

        .animate-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
    <span className="shrink-0">{icon}</span> {label}
  </button>
);

export default App;
