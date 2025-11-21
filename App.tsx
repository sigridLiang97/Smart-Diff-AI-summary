import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DiffDisplay } from './components/DiffDisplay';
import { SummaryPanel } from './components/SummaryPanel';
import { startAnalysisChat, sendFollowUpMessage } from './services/geminiService';
import { TrashIcon, SparklesIcon, UserCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { computeDiff } from './utils/diffEngine';
import { InputHighlighter } from './components/InputHighlighter';
import { ApiKeyModal } from './components/ApiKeyModal';
import { StoredKey, Persona, ChatMessage } from './types';
import { ChatSession } from '@google/genai';

const DEFAULT_ORIGINAL = `Google Gemini is a family of multimodal AI models developed by Google DeepMind. It is designed to understand and generate text, code, and images seamlessly.`;
const DEFAULT_MODIFIED = `Google Gemini is a powerful family of multimodal AI models created by Google DeepMind. It is engineered to interpret and generate text, code, audio, and images with high accuracy.`;

const App: React.FC = () => {
  // --- TEXT STATE ---
  const [originalText, setOriginalText] = useState(DEFAULT_ORIGINAL);
  const [modifiedText, setModifiedText] = useState(DEFAULT_MODIFIED);
  
  // --- CONFIG STATE ---
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [persona, setPersona] = useState<Persona>('general');
  const [question, setQuestion] = useState<string>('');
  
  // --- API KEY STATE ---
  const [apiKeys, setApiKeys] = useState<StoredKey[]>([]);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // --- AI/CHAT STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatSessionRef = useRef<ChatSession | null>(null);

  // Load API Keys from localStorage on mount
  useEffect(() => {
    const storedKeysJson = localStorage.getItem('gemini_api_keys');
    if (storedKeysJson) {
      try {
        const parsed = JSON.parse(storedKeysJson);
        if (Array.isArray(parsed)) {
          setApiKeys(parsed);
          return;
        }
      } catch (e) { console.error('Failed to parse keys', e); }
    }

    // Backwards compatibility: Check for old single key
    const oldSingleKey = localStorage.getItem('gemini_api_key');
    if (oldSingleKey) {
      const migratedKey: StoredKey = {
        id: crypto.randomUUID(),
        name: 'Default Key',
        value: oldSingleKey,
        isActive: true
      };
      setApiKeys([migratedKey]);
      localStorage.removeItem('gemini_api_key'); // Clean up
      localStorage.setItem('gemini_api_keys', JSON.stringify([migratedKey]));
    }
  }, []);

  // Persist keys when they change
  const handleUpdateKeys = (newKeys: StoredKey[]) => {
    setApiKeys(newKeys);
    localStorage.setItem('gemini_api_keys', JSON.stringify(newKeys));
  };

  // Get Active Key
  const activeKey = apiKeys.find(k => k.isActive)?.value;

  // Pre-calculate diffs
  const diffParts = React.useMemo(() => computeDiff(originalText, modifiedText), [originalText, modifiedText]);
  const hasContent = originalText.length > 0 && modifiedText.length > 0;

  // --- ACTIONS ---

  const handleStartAnalysis = useCallback(async () => {
    // If no key, open settings
    if (!activeKey) {
      setIsKeyModalOpen(true);
      return;
    }

    if (!originalText.trim() || !modifiedText.trim()) return;
    
    setIsAnalyzing(true);
    setMessages([]); // Clear previous chat
    chatSessionRef.current = null;
    
    try {
      const { session, initialResponse } = await startAnalysisChat(
        activeKey, 
        selectedModel, 
        originalText, 
        modifiedText, 
        persona, 
        question
      );
      
      chatSessionRef.current = session;
      setMessages([{
        id: crypto.randomUUID(),
        role: 'model',
        text: initialResponse,
        timestamp: Date.now()
      }]);
    } catch (error: any) {
      setMessages([{
        id: crypto.randomUUID(),
        role: 'model',
        text: `Error: ${error.message || "Failed to start analysis."}`,
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [originalText, modifiedText, selectedModel, activeKey, persona, question]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!chatSessionRef.current) return;

    // Add user message immediately
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsAnalyzing(true);

    try {
      const responseText = await sendFollowUpMessage(chatSessionRef.current, text);
      const modelMsg: ChatMessage = { id: crypto.randomUUID(), role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = { id: crypto.randomUUID(), role: 'model', text: "Error generating response. Please try again.", timestamp: Date.now(), isError: true };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleClear = () => {
    setOriginalText("");
    setModifiedText("");
    setMessages([]);
    setQuestion("");
    chatSessionRef.current = null;
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      <Header 
        selectedModel={selectedModel} 
        onModelChange={setSelectedModel}
        onOpenSettings={() => setIsKeyModalOpen(true)} 
      />

      <ApiKeyModal 
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        keys={apiKeys}
        setKeys={handleUpdateKeys}
      />

      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT PANEL: Review Mode & Chat (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar bg-slate-50/50">
          <div className="max-w-5xl mx-auto space-y-6 pb-10 h-full flex flex-col">
            {/* Diff Visualization */}
            <div className="flex-none">
              <DiffDisplay 
                originalText={originalText} 
                modifiedText={modifiedText} 
                diffParts={diffParts}
              />
            </div>

            {/* AI Chat Panel */}
            {hasContent && (
              <div className="flex-grow min-h-[500px]">
                 <SummaryPanel 
                  messages={messages}
                  isLoading={isAnalyzing} 
                  onGenerate={handleStartAnalysis}
                  onSendMessage={handleSendMessage}
                  hasContent={hasContent}
                  hasKey={!!activeKey}
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Inputs (Fixed Sidebar) */}
        <div className="w-full lg:w-[450px] xl:w-[500px] bg-white border-l border-slate-200 shadow-xl flex flex-col z-20">
          
          {/* Analysis Settings (New) */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <UserCircleIcon className="w-4 h-4" /> Analysis Persona
            </div>
            <div className="grid grid-cols-2 gap-2">
               {(['general', 'interviewer', 'academic', 'reviewer'] as Persona[]).map((p) => (
                 <button
                    key={p}
                    onClick={() => setPersona(p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all capitalize
                      ${persona === p 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }
                    `}
                 >
                   {p}
                 </button>
               ))}
            </div>

            <div className="pt-1">
               <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                 <QuestionMarkCircleIcon className="w-4 h-4" /> Context Question (Optional)
               </div>
               <input 
                 type="text" 
                 value={question}
                 onChange={(e) => setQuestion(e.target.value)}
                 placeholder="e.g. Which version sounds more confident?"
                 className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
               />
            </div>
          </div>

          {/* Main Actions */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
             <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={!hasContent || isAnalyzing}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-all text-sm"
             >
               <SparklesIcon className="w-4 h-4" />
               {isAnalyzing ? 'Analyzing...' : (messages.length > 0 ? 'Restart Analysis' : 'Start Analysis')}
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
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            
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
