
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DiffDisplay } from './components/DiffDisplay';
import { SummaryPanel } from './components/SummaryPanel';
import { startAnalysisChat, sendFollowUpMessage, resumeAnalysisChat } from './services/geminiService';
import { TrashIcon, SparklesIcon, UserCircleIcon, QuestionMarkCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import { computeDiff } from './utils/diffEngine';
import { InputHighlighter } from './components/InputHighlighter';
import { ApiKeyModal } from './components/ApiKeyModal';
import { HistoryModal } from './components/HistoryModal';
import { PersonaCreatorModal } from './components/PersonaCreatorModal';
import { StoredKey, PersonaDefinition, ChatMessage, HistoryItem } from './types';
import { Chat } from '@google/genai';

const DEFAULT_ORIGINAL = `Google Gemini is a family of multimodal AI models developed by Google DeepMind. It is designed to understand and generate text, code, and images seamlessly.`;
const DEFAULT_MODIFIED = `Google Gemini is a powerful family of multimodal AI models created by Google DeepMind. It is engineered to interpret and generate text, code, audio, and images with high accuracy.`;

const DEFAULT_PERSONAS: PersonaDefinition[] = [
  { id: 'general', name: 'General Editor', description: "You are an expert editor and proofreader. Analyze the changes objectively." },
  { id: 'interviewer', name: 'Interviewer', description: "You are a strict hiring manager or interviewer. Evaluate the text based on impact, clarity, use of the STAR method (if applicable), and professional presence. Determine which version makes the candidate sound more competent." },
  { id: 'academic', name: 'Academic Editor', description: "You are a professional academic editor. Focus on formal tone, precision, citation style consistency, and logical flow. Point out if the changes improve scientific rigor." },
  { id: 'reviewer', name: 'Peer Reviewer', description: "You are a critical peer reviewer. Look for gaps in argumentation, clarity of hypothesis, and strength of evidence. Evaluate if the modified text addresses potential reviewer concerns." },
];

const App: React.FC = () => {
  // --- TEXT STATE ---
  const [originalText, setOriginalText] = useState(DEFAULT_ORIGINAL);
  const [modifiedText, setModifiedText] = useState(DEFAULT_MODIFIED);
  
  // --- CONFIG STATE ---
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  
  // Persona State
  const [availablePersonas, setAvailablePersonas] = useState<PersonaDefinition[]>(DEFAULT_PERSONAS);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('general');
  const [isPersonaCreatorOpen, setIsPersonaCreatorOpen] = useState(false);

  const [question, setQuestion] = useState<string>('');
  
  // --- API KEY STATE ---
  const [apiKeys, setApiKeys] = useState<StoredKey[]>([]);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // --- HISTORY STATE ---
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // --- AI/CHAT STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);

  // Load Data on Mount
  useEffect(() => {
    // Keys
    const storedKeysJson = localStorage.getItem('gemini_api_keys');
    if (storedKeysJson) {
      try {
        const parsed = JSON.parse(storedKeysJson);
        if (Array.isArray(parsed)) setApiKeys(parsed);
      } catch (e) { console.error('Failed to parse keys', e); }
    }

    // History
    const storedHistoryJson = localStorage.getItem('gemini_diff_history');
    if (storedHistoryJson) {
      try {
        const parsed = JSON.parse(storedHistoryJson);
        if (Array.isArray(parsed)) setHistory(parsed);
      } catch (e) { console.error('Failed to parse history', e); }
    }

    // Custom Personas
    const storedPersonasJson = localStorage.getItem('gemini_custom_personas');
    if (storedPersonasJson) {
      try {
        const parsed = JSON.parse(storedPersonasJson);
        if (Array.isArray(parsed)) {
          setAvailablePersonas([...DEFAULT_PERSONAS, ...parsed]);
        }
      } catch (e) { console.error('Failed to parse custom personas', e); }
    }
  }, []);

  // Persist Keys
  const handleUpdateKeys = (newKeys: StoredKey[]) => {
    setApiKeys(newKeys);
    localStorage.setItem('gemini_api_keys', JSON.stringify(newKeys));
  };

  // Persist History
  const saveHistory = (newItem: HistoryItem) => {
    const updatedHistory = [newItem, ...history].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('gemini_diff_history', JSON.stringify(updatedHistory));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('gemini_diff_history');
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('gemini_diff_history', JSON.stringify(updated));
  };

  // Handle New Persona Creation
  const handleCreatePersona = (newPersona: PersonaDefinition) => {
    const updatedList = [...availablePersonas, newPersona];
    setAvailablePersonas(updatedList);
    setSelectedPersonaId(newPersona.id);
    
    // Save only custom ones to LS
    const customOnes = updatedList.filter(p => p.isCustom);
    localStorage.setItem('gemini_custom_personas', JSON.stringify(customOnes));
  };

  // Get Active Data
  const activeKey = apiKeys.find(k => k.isActive)?.value;
  const activePersona = availablePersonas.find(p => p.id === selectedPersonaId) || DEFAULT_PERSONAS[0];

  // Pre-calculate diffs
  const diffParts = React.useMemo(() => computeDiff(originalText, modifiedText), [originalText, modifiedText]);
  const hasContent = originalText.length > 0 && modifiedText.length > 0;

  // --- ACTIONS ---

  const handleStartAnalysis = useCallback(async () => {
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
        activePersona.description, // Pass the prompt text 
        question
      );
      
      chatSessionRef.current = session;
      const initialMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: initialResponse,
        timestamp: Date.now()
      };
      setMessages([initialMessage]);

      // Auto Save to History
      const historyItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        originalText,
        modifiedText,
        persona: activePersona, // Save the full object
        question,
        messages: [initialMessage]
      };
      saveHistory(historyItem);

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
  }, [originalText, modifiedText, selectedModel, activeKey, activePersona, question, history]);

  const handleLoadHistory = async (item: HistoryItem) => {
    setOriginalText(item.originalText);
    setModifiedText(item.modifiedText);
    
    // Restore Persona (Add to list if custom and missing, or just set ID)
    if (item.persona.isCustom) {
      const exists = availablePersonas.find(p => p.id === item.persona.id);
      if (!exists) {
        setAvailablePersonas(prev => [...prev, item.persona]);
      }
    }
    setSelectedPersonaId(item.persona.id);

    setQuestion(item.question);
    setMessages(item.messages);
    
    if (activeKey) {
      try {
        setIsAnalyzing(true);
        // Re-initialize session with previous context
        const session = await resumeAnalysisChat(
          activeKey, 
          selectedModel, 
          item.messages,
          item.originalText,
          item.modifiedText,
          item.persona.description,
          item.question
        );
        chatSessionRef.current = session;
      } catch (e) {
        console.error("Could not resume chat session", e);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      chatSessionRef.current = null;
    }
  };

  const handleSendMessage = useCallback(async (text: string) => {
    if (!chatSessionRef.current) {
       if (activeKey && messages.length > 0) {
          // Try to lazy resume if session was lost but context exists
          try {
            chatSessionRef.current = await resumeAnalysisChat(
              activeKey, selectedModel, messages, originalText, modifiedText, activePersona.description, question
            );
          } catch(e) { return; }
       } else {
         return;
       }
    }

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text, timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsAnalyzing(true);

    try {
      const responseText = await sendFollowUpMessage(chatSessionRef.current!, text);
      const modelMsg: ChatMessage = { id: crypto.randomUUID(), role: 'model', text: responseText, timestamp: Date.now() };
      setMessages([...updatedMessages, modelMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = { id: crypto.randomUUID(), role: 'model', text: "Error generating response.", timestamp: Date.now(), isError: true };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [messages, activeKey, selectedModel, originalText, modifiedText, activePersona, question]);

  const handleClear = () => {
    setOriginalText("");
    setModifiedText("");
    setMessages([]);
    setQuestion("");
    chatSessionRef.current = null;
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden relative">
      <Header 
        selectedModel={selectedModel} 
        onModelChange={setSelectedModel}
        onOpenSettings={() => setIsKeyModalOpen(true)} 
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      <ApiKeyModal 
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        keys={apiKeys}
        setKeys={handleUpdateKeys}
      />

      <HistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onLoad={handleLoadHistory}
        onDelete={handleDeleteHistoryItem}
        onClearAll={handleClearHistory}
      />

      <PersonaCreatorModal
        isOpen={isPersonaCreatorOpen}
        onClose={() => setIsPersonaCreatorOpen(false)}
        onSave={handleCreatePersona}
        apiKey={activeKey || ''}
        modelName={selectedModel}
      />

      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT PANEL: Review Mode & Chat */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar bg-slate-50/50">
          <div className="max-w-5xl mx-auto space-y-6 pb-10 h-full flex flex-col">
            <div className="flex-none">
              <DiffDisplay 
                originalText={originalText} 
                modifiedText={modifiedText} 
                diffParts={diffParts}
              />
            </div>

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

        {/* RIGHT PANEL: Inputs */}
        <div className="w-full lg:w-[450px] xl:w-[500px] bg-white border-l border-slate-200 shadow-xl flex flex-col z-20">
          
          {/* Analysis Settings */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
            {/* Persona Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <UserCircleIcon className="w-4 h-4" /> Analysis Persona
                </div>
                <button 
                  onClick={() => setIsPersonaCreatorOpen(true)}
                  className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800"
                >
                  <PlusIcon className="w-3 h-3" /> New Persona
                </button>
              </div>
              
              <div className="relative">
                <select
                  value={selectedPersonaId}
                  onChange={(e) => setSelectedPersonaId(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2.5 pr-8 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <optgroup label="Standard Roles">
                    {availablePersonas.filter(p => !p.isCustom).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                  {availablePersonas.some(p => p.isCustom) && (
                    <optgroup label="Custom Roles">
                      {availablePersonas.filter(p => p.isCustom).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              {/* Persona Prompt Preview */}
              <div className="mt-1.5 text-[10px] text-slate-400 leading-tight line-clamp-2 px-1">
                {activePersona.description}
              </div>
            </div>

            {/* Question Input */}
            <div>
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

          {/* Actions */}
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

          {/* Inputs */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Original */}
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

            {/* Modified */}
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
