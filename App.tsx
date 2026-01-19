
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, CaseInput, TabType, EvidenceItem } from './types';
import { analyzeLitigationData, generateBraggingContent } from './services/legalService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  FileText, Layers, Settings, CheckCircle, AlertTriangle, Gavel, 
  Loader2, ShieldCheck, Scale, Trash2, Key, Zap, Copy, FileSearch, 
  BookOpen, ArrowRight, Sparkles, Info, Lock, Unlock, ShieldAlert,
  Sword, BookMarked, MessageSquareText, Landmark, RefreshCw, PlusCircle,
  Download, Image as ImageIcon, ChevronDown, User, Coffee, Megaphone, Send,
  Target, Activity, Table, Plus, X, UploadCloud, FileUp, FileAudio, FileType,
  Lightbulb, HelpCircle, Menu
} from 'lucide-react';

const App: React.FC = () => {
  const [caseInfo, setCaseInfo] = useState('');
  const [claims, setClaims] = useState('');
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('strategy');
  
  // 装逼神器状态
  const [bragStyle, setBragStyle] = useState('随机');
  const [bragContext, setBragContext] = useState('');
  const [bragResults, setBragResults] = useState<string[]>([]);
  const [isBragLoading, setIsBragLoading] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const caseInfoTextareaRef = useRef<HTMLTextAreaElement>(null);
  const claimsTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 案情描述自适应高度逻辑
  useEffect(() => {
    if (caseInfoTextareaRef.current) {
      caseInfoTextareaRef.current.style.height = 'auto';
      caseInfoTextareaRef.current.style.height = `${caseInfoTextareaRef.current.scrollHeight}px`;
    }
  }, [caseInfo, activeTab]);

  // 诉讼主张自适应高度逻辑
  useEffect(() => {
    if (claimsTextareaRef.current) {
      claimsTextareaRef.current.style.height = 'auto';
      claimsTextareaRef.current.style.height = `${claimsTextareaRef.current.scrollHeight}px`;
    }
  }, [claims, activeTab]);

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
        const { caseInfo: sCase, claims: sClaims, evidenceList: sEvidence } = JSON.parse(saved);
        setCaseInfo(sCase || '');
        setClaims(sClaims || '');
        setEvidenceList(sEvidence || []);
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('legal_case_web_draft', JSON.stringify({ caseInfo, claims, evidenceList }));
  }, [caseInfo, claims, evidenceList]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
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

  const removeEvidence = (id: string) => {
    setEvidenceList(prev => prev.filter(item => item.id !== id));
  };

  const updateEvidenceFact = (id: string, fact: string) => {
    setEvidenceList(prev => prev.map(item => item.id === id ? { ...item, provedFact: fact } : item));
  };

  const handleAnalyze = async () => {
    if (!caseInfo.trim() && evidenceList.length === 0) {
      alert("请至少录入案情或上传证据文件");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const data = await analyzeLitigationData({ 
        caseInfo, 
        claims, 
        evidenceFiles: evidenceList 
      });
      setResult(data);
      setIsLoading(false);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err: any) {
      setError(err.message || '分析过程中发生未知错误');
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
    if (window.confirm("确定要清空所有数据吗？此操作不可逆。")) {
      setCaseInfo('');
      setClaims('');
      setEvidenceList([]);
      setResult(null);
      localStorage.removeItem('legal_case_web_draft');
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
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  const exportToImage = async () => {
    const canvas = await generateCanvas();
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL("image/png");
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

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 mb-10 cursor-default select-none group transition-transform active:scale-95">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50 group-hover:bg-blue-500 transition-colors">
          <Scale size={24} />
        </div>
        <div>
          <h1 className="font-black tracking-tighter text-lg leading-none text-white">Litigation</h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Matrix Pro</p>
        </div>
      </div>

      <nav className="flex-grow space-y-2">
        <NavBtn active={activeTab === 'strategy'} onClick={() => { setActiveTab('strategy'); setIsMobileMenuOpen(false); }} icon={<Target size={18} />} label="诉讼方案生成" />
        <NavBtn active={activeTab === 'matrix'} onClick={() => { setActiveTab('matrix'); setIsMobileMenuOpen(false); }} icon={<Layers size={18} />} label="证据矩阵审计" />
        <NavBtn active={activeTab === 'bragging'} onClick={() => { setActiveTab('bragging'); setIsMobileMenuOpen(false); }} icon={<Megaphone size={18} />} label="装逼神器" />
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="p-4 bg-slate-800/50 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Legal Engine</span>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><Activity size={10} className="animate-pulse" /> 实时推理在线</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[100] md:hidden backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar (Drawer) */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-slate-900 p-6 text-white z-[101] transform transition-transform duration-300 md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
          <X size={24} />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 flex-col sticky top-0 h-screen p-6 text-white shrink-0">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0 overflow-y-auto relative">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] truncate max-w-[150px] md:max-w-none">
              <span className="hidden sm:inline">Workflow</span>
              <ArrowRight size={10} className="hidden sm:inline" />
              <span className="text-slate-900">
                {activeTab === 'strategy' ? 'Strategy' : 
                 activeTab === 'matrix' ? 'Matrix' : 
                 activeTab === 'bragging' ? 'Bragging' : 'Settings'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
             <button onClick={clearSession} title="重置全部数据" className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
               <RefreshCw size={18} />
             </button>
             
             {result && (activeTab === 'strategy' || activeTab === 'matrix') && (
               <div className="relative" ref={exportMenuRef}>
                 <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={isExporting}
                  className="flex items-center gap-2 text-[10px] font-black bg-slate-900 text-white px-3 md:px-4 py-2 rounded-full hover:bg-blue-600 transition-all active:scale-95 disabled:bg-slate-400"
                 >
                   {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                   <span className="hidden xs:inline">{isExporting ? '生成中' : '导出结果'}</span>
                   <ChevronDown size={10} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                 </button>

                 {showExportMenu && (
                   <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                     <button onClick={exportToPDF} className="w-full px-5 py-3 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                       <FileText size={14} className="text-rose-500" /> 导出报告 PDF
                     </button>
                     <button onClick={exportToImage} className="w-full px-5 py-3 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                       <ImageIcon size={14} className="text-blue-500" /> 导出长图 PNG
                     </button>
                   </div>
                 )}
               </div>
             )}
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6 md:space-y-10">
          {activeTab === 'strategy' && (
            <div className="space-y-6 animate-in">
              {/* 功能指南：诉讼方案生成 */}
              <div className="bg-blue-600 rounded-2xl md:rounded-[2rem] p-5 md:p-8 text-white shadow-xl shadow-blue-200/50 flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                  <Lightbulb size={24} className="md:size-[32px]" />
                </div>
                <div className="space-y-1 md:space-y-2 text-center sm:text-left">
                  <h3 className="text-base md:text-lg font-black tracking-tight">诉讼方案生成指南</h3>
                  <p className="text-xs md:text-sm text-blue-100 font-medium leading-relaxed">
                    <span className="bg-white/20 px-1.5 py-0.5 rounded mr-1">使用方法</span> 
                    在下方录入详细案情与诉请。AI 将基于深度法律逻辑为您推演全局。
                    <br />
                    <span className="bg-white/20 px-1.5 py-0.5 rounded mr-1">核心价值</span> 
                    由“诉棍快乐屋”为您快速锁定法庭焦点，预判对手路径，生成专业行动蓝图。
                  </p>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200 p-5 md:p-8">
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <FileText size={16} className="text-blue-600" />
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">案情全景描述</label>
                    </div>
                    <textarea 
                      ref={caseInfoTextareaRef}
                      rows={2}
                      className="w-full p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-2xl md:rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none text-sm leading-[1.6] md:leading-[1.8] transition-all resize-none font-medium overflow-hidden min-h-[4.5em]"
                      placeholder="请详细描述争议背景、关键时间节点及事实细节..."
                      value={caseInfo}
                      onChange={(e) => setCaseInfo(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200 p-5 md:p-8">
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <Gavel size={16} className="text-blue-600" />
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">诉讼主张 / 防御</label>
                    </div>
                    <textarea 
                      ref={claimsTextareaRef}
                      rows={2}
                      className="w-full p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-2xl md:rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none text-sm leading-[1.6] md:leading-[1.8] transition-all resize-none font-medium overflow-hidden min-h-[4.5em]"
                      placeholder="明确诉讼请求或法律立场..."
                      value={claims}
                      onChange={(e) => setClaims(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full h-auto py-5 md:py-8 bg-slate-900 text-white rounded-2xl md:rounded-[2rem] font-black text-base md:text-lg shadow-2xl shadow-slate-200 hover:bg-blue-600 disabled:bg-slate-300 transition-all flex flex-row items-center justify-center gap-3 active:scale-[0.98] whitespace-nowrap overflow-hidden"
                  >
                    {isLoading ? <Loader2 className="animate-spin shrink-0" size={24} /> : <Zap className="shrink-0" size={24} />}
                    <span className="truncate">{isLoading ? '引擎规划中...' : '生成全局诉讼方案'}</span>
                  </button>
                </div>
              </div>

              {result && (
                <div ref={resultRef} className="space-y-8 md:space-y-10 pt-8 md:pt-12 animate-in pb-12 md:pb-20">
                   <ReportHeader result={result} />
                   <StrategySection strategy={result.strategy} />
                   <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                     <FocusPoints points={result.keyPoints} />
                     <RiskSection risks={result.risks} />
                   </div>
                   <LawAndCases result={result} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-8 animate-in">
              {/* 功能指南：证据矩阵审计 */}
              <div className="bg-slate-900 rounded-2xl md:rounded-[2rem] p-5 md:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                  <HelpCircle size={24} className="md:size-[32px]" />
                </div>
                <div className="space-y-1 md:space-y-2 text-center sm:text-left">
                  <h3 className="text-base md:text-lg font-black tracking-tight">证据矩阵审计指南</h3>
                  <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed">
                    <span className="text-blue-400 mr-1">使用方法</span> 
                    上传证据扫描件或录音，并填写“证明目的”。
                    <br />
                    <span className="text-blue-400 mr-1">核心价值</span> 
                    由“诉棍快乐屋”针对每一项证据进行“三性”审计，识别断裂点，生成质证对抗预案。
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200 p-5 md:p-10">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-10 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <UploadCloud size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-800">证据原件管理</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit Matrix</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl active:scale-95"
                    >
                      <Plus size={16} /> 上传证据
                    </button>
                    <input 
                      type="file" 
                      multiple 
                      hidden 
                      ref={fileInputRef} 
                      onChange={handleFileUpload}
                      accept="image/*,application/pdf,.doc,.docx"
                    />
                 </div>

                 {evidenceList.length === 0 ? (
                   <div className="border-4 border-dashed border-slate-100 rounded-2xl md:rounded-[3rem] py-12 md:py-24 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileUp className="text-slate-200" size={32} />
                      </div>
                      <p className="text-xs md:text-sm text-slate-400 font-bold px-4">拖拽或点击上方按钮上传证据扫描件/照片/录音</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                      {evidenceList.map((item) => (
                        <div key={item.id} className="bg-slate-50/50 p-4 md:p-6 rounded-xl md:rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row gap-4 md:gap-6 items-start hover:bg-white hover:shadow-lg transition-all group">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                             {item.type.startsWith('image') ? (
                               <img src={item.data} className="w-full h-full object-cover" alt="preview" />
                             ) : item.type.includes('pdf') ? (
                               <FileText size={28} className="text-rose-500" />
                             ) : (
                               <FileType size={28} className="text-blue-500" />
                             )}
                          </div>
                          <div className="flex-grow space-y-3 w-full">
                             <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                   <h4 className="font-black text-xs md:text-sm text-slate-800 line-clamp-1">{item.name}</h4>
                                   <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">{item.size} • {item.type}</p>
                                </div>
                                <button onClick={() => removeEvidence(item.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                  <X size={16} />
                                </button>
                             </div>
                             <div className="relative">
                               <label className="text-[8px] md:text-[9px] font-black text-blue-500 uppercase absolute -top-2 left-3 bg-white px-1">证明目的</label>
                               <input 
                                 type="text" 
                                 className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                                 placeholder="描述该证据的证明作用..."
                                 value={item.provedFact}
                                 onChange={(e) => updateEvidenceFact(item.id, e.target.value)}
                               />
                             </div>
                          </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>

              {evidenceList.length > 0 && (
                <div className="flex justify-center">
                  <button 
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-10 md:px-16 py-4 md:py-6 bg-blue-600 text-white rounded-xl md:rounded-[2.5rem] font-black text-base md:text-xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:bg-slate-300"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />} 
                    {isLoading ? 'AI 审计中...' : '开始三性审计'}
                  </button>
                </div>
              )}

              {result && (
                <div ref={resultRef} className="space-y-8 pb-12 pt-6 animate-in">
                   <div className="flex items-center gap-3 px-2">
                    <Layers className="text-blue-600" size={24} />
                    <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">审计矩阵</h2>
                  </div>
                  
                  <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th className="px-6 md:px-10 py-4">证据项</th>
                            <th className="px-6 md:px-10 py-4">审计结论</th>
                            <th className="px-6 md:px-10 py-4 text-center">风险</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {result.evidenceList.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="px-6 md:px-10 py-6 md:py-8">
                                <span className="font-bold text-slate-800 text-xs md:text-sm">{item.name}</span>
                              </td>
                              <td className="px-6 md:px-10 py-6 md:py-8">
                                <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">{item.provedFact}</p>
                              </td>
                              <td className="px-6 md:px-10 py-6 md:py-8 text-center">
                                <span className={`px-2 md:px-4 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase whitespace-nowrap ${
                                  item.reliability === 'High' ? 'bg-emerald-50 text-emerald-600' : 
                                  item.reliability === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                  {item.reliability === 'High' ? '合规' : item.reliability === 'Medium' ? '需补强' : '瑕疵'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                    <div className="bg-indigo-900 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 text-white shadow-xl">
                       <h3 className="font-black text-xs md:text-sm uppercase tracking-widest text-indigo-300 mb-6 flex items-center gap-2">
                         <PlusCircle size={18} /> 补齐链条
                       </h3>
                       <div className="space-y-4">
                         {result.reinforcement.map((r, i) => (
                           <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
                              <p className="text-xs font-bold text-white mb-2 italic">“{r.gap}”</p>
                              <p className="text-[10px] md:text-xs text-indigo-100/70 leading-relaxed font-medium">补强：{r.suggestion}</p>
                           </div>
                         ))}
                       </div>
                    </div>
                    <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200 p-6 md:p-10">
                       <h3 className="font-black text-xs md:text-sm uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                         <Sword size={18} /> 质证对抗
                       </h3>
                       <div className="space-y-5">
                         {result.confrontation.map((c, i) => (
                           <div key={i} className="space-y-3">
                              <div className="bg-slate-50 p-4 rounded-xl text-[10px] md:text-xs font-bold text-slate-500 relative">
                                <span className="absolute -top-2 left-4 px-2 py-0.5 bg-slate-900 text-white rounded text-[7px]">对方</span>
                                {c.opponentArgument}
                              </div>
                              <div className="bg-blue-50 p-4 rounded-xl text-[10px] md:text-xs font-black text-blue-900 relative ml-6">
                                <span className="absolute -top-2 left-4 px-2 py-0.5 bg-blue-600 text-white rounded text-[7px]">我方</span>
                                {c.counterStrategy}
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
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in pb-12">
              {/* 功能指南：装逼神器 */}
              <div className="bg-amber-100 rounded-2xl md:rounded-[2rem] p-5 md:p-8 text-amber-900 border border-amber-200 flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/50 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-amber-600">
                  <Sparkles className="size-6 md:size-8" />
                </div>
                <div className="space-y-1 md:space-y-2 text-center sm:text-left">
                  <h3 className="text-base md:text-lg font-black tracking-tight">装逼神器使用指南</h3>
                  <p className="text-[10px] md:text-xs font-bold leading-relaxed opacity-80">
                    <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded mr-1">使用方法</span> 
                    点击下方标签，生成具备“大律师感”的话术。
                    <br />
                    <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded mr-1">核心价值</span> 
                    “诉棍快乐屋”为您在同行交流中提供秒回建议，展现权威或巧妙化解尴尬。
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl md:rounded-[3rem] p-6 md:p-10 shadow-sm border border-slate-200">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                    <Megaphone className="text-amber-600" size={32} />
                  </div>
                  <h3 className="font-black text-xl md:text-2xl mb-1 md:mb-2">社交影响力生成器</h3>
                  <p className="text-slate-400 text-[10px] tracking-widest uppercase font-bold">Powered by Lawyer Happy House</p>
                </div>

                <div className="space-y-6 md:space-y-8">
                  <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                    {['随机', '高冷', '穷嗨', '专业', '苦逼', '妖娆', '回复'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setBragStyle(style)}
                        className={`px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all border ${
                          bragStyle === style 
                          ? 'bg-slate-900 text-white border-transparent shadow-xl scale-105' 
                          : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>

                  {bragStyle === '回复' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <textarea
                        className="w-full p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-xl md:rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none text-xs md:text-sm transition-all resize-none h-24 md:h-32 font-medium"
                        placeholder="粘贴对方的提问..."
                        value={bragContext}
                        onChange={(e) => setBragContext(e.target.value)}
                      />
                    </div>
                  )}

                  <button
                    onClick={handleGenerateBrag}
                    disabled={isBragLoading}
                    className="w-full py-4 md:py-6 bg-blue-600 text-white rounded-xl md:rounded-[2rem] font-black text-base md:text-xl shadow-2xl hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {isBragLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    {isBragLoading ? '构思中...' : '生成 5 条爆款话术'}
                  </button>
                </div>
              </div>

              {bragResults.length > 0 && (
                <div className="grid gap-3 md:gap-4 animate-in">
                   {bragResults.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        navigator.clipboard.writeText(item);
                        alert("复制成功！");
                      }}
                      className="group bg-white p-6 md:p-8 rounded-xl md:rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer relative"
                    >
                      <p className="text-sm md:text-base font-bold text-slate-800 leading-relaxed group-hover:text-blue-800">{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #f8fafc; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @media (max-width: 640px) {
          .xs\\:inline { display: inline; }
        }
      `}</style>
    </div>
  );
};

// --- 子组件提取以保持代码清晰 ---

const NavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
    {icon} {label}
  </button>
);

const ReportHeader = ({ result }: { result: AnalysisResult }) => (
  <div className="flex items-center justify-between px-2">
    <div className="flex items-center gap-3">
      <Target className="text-blue-600 size-5 md:size-7" />
      <h2 className="text-lg md:text-3xl font-black text-slate-800 tracking-tight">诉讼策略报告</h2>
    </div>
    <div className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 px-4 py-2 rounded-full">
      Reasoning Optimized
    </div>
  </div>
);

const StrategySection = ({ strategy }: { strategy: string }) => (
  <div className="bg-slate-900 rounded-2xl md:rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-white/5">
    <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-blue-600/20 blur-[80px] md:blur-[120px] pointer-events-none"></div>
    <div className="flex items-center gap-4 mb-6 md:mb-8 relative">
      <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl">
        <ShieldCheck className="size-6 md:size-7" />
      </div>
      <div>
        <h3 className="text-base md:text-xl font-black uppercase tracking-widest">核心执行方案</h3>
        <p className="text-[9px] md:text-[10px] text-blue-300 font-bold opacity-60 uppercase">Strategic Blueprint</p>
      </div>
    </div>
    <p className="text-sm md:text-xl leading-relaxed text-blue-50/90 font-medium whitespace-pre-wrap italic border-l-4 border-blue-600 pl-4 md:pl-8">{strategy}</p>
  </div>
);

const FocusPoints = ({ points }: { points: string[] }) => (
  <section className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200 p-6 md:p-10">
    <div className="flex items-center gap-4 mb-6 md:mb-8">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600">
        <MessageSquareText className="size-5 md:size-6" />
      </div>
      <h3 className="font-black text-xs md:text-sm uppercase tracking-widest">审理焦点</h3>
    </div>
    <div className="space-y-3 md:space-y-4">
      {points.map((p, i) => (
        <div key={i} className="flex gap-4 md:gap-5 items-start bg-slate-50 p-4 md:p-6 rounded-2xl md:rounded-3xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-blue-100">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-blue-100 flex items-center justify-center text-[10px] md:text-xs font-black text-blue-600 shrink-0">{i+1}</div>
          <p className="text-xs md:text-sm font-bold text-slate-700 leading-relaxed">{p}</p>
        </div>
      ))}
    </div>
  </section>
);

const RiskSection = ({ risks }: { risks: any[] }) => (
  <section className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200 p-6 md:p-10">
    <div className="flex items-center gap-4 mb-6 md:mb-8">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 rounded-xl md:rounded-2xl flex items-center justify-center text-rose-600">
        <ShieldAlert className="size-5 md:size-6" />
      </div>
      <h3 className="font-black text-xs md:text-sm uppercase tracking-widest">风险预警</h3>
    </div>
    <div className="space-y-5 md:space-y-6">
      {risks.map((r, i) => (
        <div key={i} className="p-4 md:p-6 bg-rose-50/20 rounded-2xl md:rounded-[2rem] border border-rose-100/50">
          <h4 className="text-xs md:text-sm font-black text-rose-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="size-3 md:size-3.5" /> {r.riskPoint}
          </h4>
          <p className="text-[10px] md:text-xs text-slate-600 mb-3 md:mb-4 leading-relaxed">{r.description}</p>
          <div className="bg-white/80 px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black text-blue-700 flex items-center gap-2 md:gap-3 border border-blue-50 shadow-sm">
            <span className="shrink-0 bg-blue-600 text-white px-1.5 py-0.5 rounded">对策</span>
            {r.mitigation}
          </div>
        </div>
      ))}
    </div>
  </section>
);

const LawAndCases = ({ result }: { result: AnalysisResult }) => (
  <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
    <div className="lg:col-span-1 bg-slate-900 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 text-white">
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <BookMarked className="text-blue-400 size-5 md:size-6" />
        <h3 className="font-black text-xs md:text-sm uppercase tracking-widest text-blue-100">法律依据</h3>
      </div>
      <div className="space-y-6 md:space-y-8">
        {result.statutes.map((s, i) => (
          <div key={i} className="border-l-2 border-slate-700 pl-4 md:pl-6 group">
            <h4 className="text-[10px] md:text-xs font-black text-blue-400 mb-1 md:mb-2 uppercase">{s.name}</h4>
            <p className="text-xs md:text-sm leading-relaxed text-slate-400 font-medium">{s.content}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="lg:col-span-2 bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200 p-6 md:p-10">
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <Landmark className="text-slate-400 size-5 md:size-6" />
        <h3 className="font-black text-xs md:text-sm uppercase tracking-widest">类案裁判标准</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
        {result.caseLaw.map((c, i) => (
          <div key={i} className="bg-slate-50/50 p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 flex flex-col h-full hover:shadow-lg transition-all">
            <h4 className="text-xs md:text-sm font-black text-slate-800 mb-2 md:mb-3 line-clamp-2">{c.title}</h4>
            <p className="text-[10px] md:text-[11px] text-slate-500 mb-4 md:mb-6 flex-grow leading-relaxed italic">“{c.summary}”</p>
            <div className="mt-auto pt-4 border-t border-slate-200 flex justify-between items-center text-[8px] md:text-[9px] font-bold text-slate-400">
              <span>{c.court}</span>
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg uppercase">胜诉</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default App;
