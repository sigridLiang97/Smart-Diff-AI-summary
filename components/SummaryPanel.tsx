import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { KeyIcon } from '@heroicons/react/24/outline';

interface SummaryPanelProps {
  summary: string;
  isLoading: boolean;
  onGenerate: () => void;
  hasContent: boolean;
  hasKey: boolean;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ summary, isLoading, onGenerate, hasContent, hasKey }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-indigo-600">
            <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436h.021a.75.75 0 010 1.5h-2.17a4.897 4.897 0 01-1.176 1.571l-2.81 2.81a2.165 2.165 0 01-3.063 0l-4.292-4.293a2.165 2.165 0 010-3.063l2.81-2.81a4.897 4.897 0 011.572-1.176v-2.17a.75.75 0 011.5-.001v.021zM9.75 15a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" clipRule="evenodd" />
          </svg>
          AI Analysis
        </h2>
      </div>

      <div className="flex-grow">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-4 animate-pulse">
             <div className="h-2 bg-slate-200 rounded w-3/4"></div>
             <div className="h-2 bg-slate-200 rounded w-5/6"></div>
             <div className="h-2 bg-slate-200 rounded w-2/3"></div>
             <p className="text-sm text-slate-400 font-medium">Gemini is analyzing changes...</p>
          </div>
        ) : summary ? (
          <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-slate-800" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-md font-bold text-slate-900 mt-4 mb-2" {...props} />,
              }}
            >
              {summary}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            {!hasKey ? (
              <>
                <div className="p-3 bg-indigo-50 rounded-full mb-3">
                  <KeyIcon className="w-6 h-6 text-indigo-500" />
                </div>
                <p className="text-slate-500 mb-4 text-sm max-w-xs">
                  Configure your API Key to enable intelligent analysis of changes.
                </p>
                <button
                  onClick={onGenerate}
                  className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                  Setup API Key
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-400 mb-4 text-sm">
                  Ready to analyze. Enter text in both fields to compare.
                </p>
                <button
                  onClick={onGenerate}
                  disabled={!hasContent}
                  className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm
                    ${hasContent 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md cursor-pointer' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                  `}
                >
                  Generate Analysis
                </button>
              </>
            )}
          </div>
        )}
      </div>
      
      {summary && !isLoading && (
         <button
         onClick={onGenerate}
         className="mt-6 w-full py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
       >
         Regenerate Analysis
       </button>
      )}
    </div>
  );
};