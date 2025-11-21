import React from 'react';
import { XMarkIcon, ClockIcon, TrashIcon, ArrowPathIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { HistoryItem } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onLoad,
  onDelete,
  onClearAll
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const handleCopyAnalysis = (item: HistoryItem) => {
    // Join all model responses
    const analysisText = item.messages
      .filter(m => m.role === 'model' && !m.isError)
      .map(m => m.text)
      .join('\n\n---\n\n');
    
    navigator.clipboard.writeText(analysisText);
    alert('Full analysis copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm">
      {/* Drawer Container */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-lg">History</h2>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
              {history.length}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-slate-50/30">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8">
              <ClockIcon className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">No history yet.</p>
              <p className="text-xs mt-1">Start an analysis to save it automatically.</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id} 
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow group relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                    {formatDate(item.timestamp)}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    item.persona === 'general' ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  }`}>
                    {item.persona}
                  </span>
                </div>

                <div className="mb-3">
                   {item.question && (
                     <div className="text-xs font-medium text-slate-800 mb-1 line-clamp-1">
                       Q: {item.question}
                     </div>
                   )}
                   <div className="text-xs text-slate-500 line-clamp-2 font-mono bg-slate-50 p-1.5 rounded border border-slate-100">
                     {item.originalText.substring(0, 60)}...
                   </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => { onLoad(item); onClose(); }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <ArrowPathIcon className="w-3 h-3" /> Load
                  </button>
                  
                  <button
                    onClick={() => handleCopyAnalysis(item)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-1"
                    title="Copy full AI analysis"
                  >
                    <ClipboardDocumentIcon className="w-3 h-3" /> Copy
                  </button>

                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete item"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 bg-white border-t border-slate-200">
            <button
              onClick={() => {
                if (confirm('Clear all history? This cannot be undone.')) onClearAll();
              }}
              className="w-full py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};