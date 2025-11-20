import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { DiffDisplay } from './components/DiffDisplay';
import { SummaryPanel } from './components/SummaryPanel';
import { generateDiffSummary } from './services/geminiService';
import { TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { computeDiff } from './utils/diffEngine';
import { InputHighlighter } from './components/InputHighlighter';
import { ApiKeyModal } from './components/ApiKeyModal';

const DEFAULT_ORIGINAL = `Google Gemini is a family of multimodal AI models developed by Google DeepMind. It is designed to understand and generate text, code, and images seamlessly.`;
const DEFAULT_MODIFIED = `Google Gemini is a powerful family of multimodal AI models created by Google DeepMind. It is engineered to interpret and generate text, code, audio, and images with high accuracy.`;

const App: React.FC = () => {
  const [originalText, setOriginalText] = useState(DEFAULT_ORIGINAL);
  const [modifiedText, setModifiedText] = useState(DEFAULT_MODIFIED);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  
  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  
  // AI State
  const [summary, setSummary] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load API Key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
    // REMOVED: Automatic modal opening logic
  }, []);

  const handleSaveKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
    setIsKeyModalOpen(false);
  };

  // Pre-calculate diffs at top level to share with input highlighters
  const diffParts = React.useMemo(() => computeDiff(originalText, modifiedText), [originalText, modifiedText]);

  const handleAnalysis = useCallback(async () => {
    // If no key, open settings instead of analyzing
    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }

    if (!originalText.trim() || !modifiedText.trim()) return;
    
    setIsAnalyzing(true);
    setSummary(""); // Clear previous summary
    
    const result = await generateDiffSummary(originalText, modifiedText, selectedModel, apiKey);
    setSummary(result);
    setIsAnalyzing(false);
  }, [originalText, modifiedText, selectedModel, apiKey]);

  const handleClear = () => {
    // REMOVED: window.confirm blocking call
    setOriginalText("");
    setModifiedText("");
    setSummary("");
  };

  const hasContent = originalText.length > 0 && modifiedText.length > 0;

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      <Header 
        selectedModel={selectedModel} 
        onModelChange={setSelectedModel}
        onOpenSettings={() => setIsKeyModalOpen(true)} 
      />

      <ApiKeyModal 
        isOpen={isKeyModalOpen}
        onSave={handleSaveKey}
        onClose={() => setIsKeyModalOpen(false)}
        hasKey={!!apiKey}
      />

      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT PANEL: Review Mode & AI Summary (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar bg-slate-50/50">
          <div className="max-w-5xl mx-auto space-y-8 pb-10">
            {/* Diff Visualization */}
            <section>
              <DiffDisplay 
                originalText={originalText} 
                modifiedText={modifiedText} 
                diffParts={diffParts}
              />
            </section>

            {/* AI Analysis Panel */}
            {hasContent && (
              <section>
                 <SummaryPanel 
                  summary={summary} 
                  isLoading={isAnalyzing} 
                  onGenerate={handleAnalysis}
                  hasContent={hasContent}
                  hasKey={!!apiKey}
                />
              </section>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Inputs (Fixed Sidebar) */}
        <div className="w-full lg:w-[450px] xl:w-[500px] bg-white border-l border-slate-200 shadow-xl flex flex-col z-20">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
             <button
                type="button"
                onClick={handleAnalysis}
                disabled={!hasContent || isAnalyzing}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-all text-sm"
             >
               <SparklesIcon className="w-4 h-4" />
               {isAnalyzing ? 'Analyzing...' : 'Analyze Differences'}
             </button>
             
             <button
                type="button"
                onClick={handleClear}
                className="flex items-center justify-center p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear all text"
             >
               <TrashIcon className="w-5 h-5" />
             </button>
          </div>

          {/* Input Areas Container */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Top: Original Text (Red Theme) */}
            <div className="flex-1 flex flex-col min-h-0 border-b border-slate-100 bg-red-50/10 relative">
              <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex justify-between items-center z-10 relative">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500"></div>
                   <label className="text-xs font-bold text-red-800 uppercase tracking-wider">Original Text</label>
                 </div>
                 <span className="text-xs text-red-400 font-medium">{originalText.length} chars</span>
              </div>
              
              <div className="flex-1 relative min-h-0">
                <InputHighlighter 
                  text={originalText}
                  onChange={setOriginalText}
                  diffParts={diffParts}
                  type="original"
                  placeholder="Paste original text here..."
                />
              </div>
            </div>

            {/* Bottom: Modified Text (Green Theme) */}
            <div className="flex-1 flex flex-col min-h-0 bg-green-50/10 relative">
              <div className="px-4 py-2 bg-green-50 border-b border-green-100 border-t border-t-slate-100 flex justify-between items-center z-10 relative">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <label className="text-xs font-bold text-green-800 uppercase tracking-wider">Modified Text</label>
                 </div>
                 <span className="text-xs text-green-500 font-medium">{modifiedText.length} chars</span>
              </div>
              
              <div className="flex-1 relative min-h-0">
                <InputHighlighter 
                  text={modifiedText}
                  onChange={setModifiedText}
                  diffParts={diffParts}
                  type="modified"
                  placeholder="Paste modified text here..."
                />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default App;