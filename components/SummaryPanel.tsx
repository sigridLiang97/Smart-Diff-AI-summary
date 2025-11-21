import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { KeyIcon, PaperAirplaneIcon, ClipboardDocumentIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { ChatMessage } from '../types';

interface SummaryPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onGenerate: () => void;
  onSendMessage: (text: string) => void;
  hasContent: boolean;
  hasKey: boolean;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ 
  messages, 
  isLoading, 
  onGenerate, 
  onSendMessage,
  hasContent, 
  hasKey 
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-indigo-600" />
          AI Analyst
        </h2>
        {!isEmpty && (
          <button 
            onClick={onGenerate} 
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Restart Analysis
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-white space-y-6">
        {isEmpty ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center min-h-[300px]">
            {!hasKey ? (
              <>
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                  <KeyIcon className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-slate-900 font-medium mb-2">API Key Required</h3>
                <p className="text-slate-500 mb-6 text-sm max-w-xs">
                  Configure your API Key to enable intelligent chat and analysis of changes.
                </p>
                <button
                  onClick={onGenerate} // Triggers key modal in App
                  className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                  Setup API Key
                </button>
              </>
            ) : (
              <>
                <div className="p-4 bg-indigo-50 rounded-full mb-4">
                  <SparklesIcon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-slate-900 font-medium mb-2">Ready to Analyze</h3>
                <p className="text-slate-500 mb-6 text-sm max-w-xs">
                  Select a persona, ask a question (optional), and start the analysis.
                </p>
                <button
                  onClick={onGenerate}
                  disabled={!hasContent}
                  className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm
                    ${hasContent 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md cursor-pointer' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                  `}
                >
                  Start Analysis
                </button>
              </>
            )}
          </div>
        ) : (
          // Message List
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[90%] rounded-2xl p-5 relative group ${
                    msg.role === 'user' 
                      ? 'bg-indigo-50 text-slate-800 rounded-br-none' 
                      : 'bg-white border border-slate-100 shadow-sm rounded-bl-none'
                  } ${msg.isError ? 'bg-red-50 border-red-100 text-red-600' : ''}`}
                >
                  {/* Copy Button for Model */}
                  {msg.role === 'model' && !msg.isError && (
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                      title="Copy to clipboard"
                    >
                      {copiedId === msg.id ? <CheckIcon className="w-4 h-4 text-green-600" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                    </button>
                  )}

                  <div className={`prose prose-sm max-w-none leading-relaxed ${msg.role === 'user' ? 'prose-p:mb-0' : ''}`}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">
                    {msg.role === 'user' ? 'You' : 'Gemini AI'}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-none p-5">
                    <div className="flex space-x-2 items-center h-6">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area (Only if active chat) */}
      {!isEmpty && (
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a follow-up question..."
              disabled={isLoading}
              className="flex-grow bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
