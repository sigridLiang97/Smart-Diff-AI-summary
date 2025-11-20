import React, { useMemo, useState } from 'react';
import { computeDiff } from '../utils/diffEngine';
import { DiffPart } from '../types';
import { EyeIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';

interface DiffDisplayProps {
  originalText: string;
  modifiedText: string;
  diffParts?: DiffPart[];
}

type ViewMode = 'split' | 'unified';

export const DiffDisplay: React.FC<DiffDisplayProps> = ({ originalText, modifiedText, diffParts }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('unified');
  
  // Compute diff only when inputs change, or use provided diffParts
  const diffResult = useMemo(() => {
    if (diffParts) return diffParts;
    return computeDiff(originalText, modifiedText);
  }, [originalText, modifiedText, diffParts]);

  const hasContent = originalText || modifiedText;

  if (!hasContent) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm border-dashed">
        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <EyeIcon className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">Ready to Compare</h3>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">
          Paste your text into the panels on the right. The differences and a "Track Changes" style review view will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Toolbar / View Toggle */}
      <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            {viewMode === 'unified' ? 'Review Mode' : 'Comparison View'}
          </h3>
          
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${viewMode === 'unified' ? 'bg-red-500' : 'bg-red-400'}`}></span>
              <span className="text-slate-500">Deleted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${viewMode === 'unified' ? 'bg-green-500' : 'bg-green-500'}`}></span>
              <span className="text-slate-500">Added</span>
            </div>
          </div>
        </div>

        <div className="flex bg-slate-200/60 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('unified')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'unified'
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Inline Review Mode (Like Word)"
          >
            <EyeIcon className="w-4 h-4" />
            Review
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'split'
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Side-by-Side Comparison"
          >
            <ViewColumnsIcon className="w-4 h-4" />
            Split
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-slate-50/30 min-h-[300px]">
        {viewMode === 'split' ? (
          // --- Split View (Side by Side) ---
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* Original Text Panel */}
            <div className="bg-white p-6">
              <h4 className="text-xs uppercase tracking-wide text-slate-400 font-bold mb-4 select-none">Original</h4>
              <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-700 break-words">
                {diffResult.map((part, index) => {
                  if (part.removed) {
                    return (
                      <span key={index} className="bg-red-100 text-red-800 line-through decoration-red-400/50 select-none opacity-80 rounded-[2px] px-0.5">
                        {part.value}
                      </span>
                    );
                  }
                  if (part.added) {
                    return null; // Hide added text in original view
                  }
                  return <span key={index}>{part.value}</span>;
                })}
              </div>
            </div>

            {/* Modified Text Panel */}
            <div className="bg-white p-6">
              <h4 className="text-xs uppercase tracking-wide text-slate-400 font-bold mb-4 select-none">Modified</h4>
              <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-700 break-words">
                {diffResult.map((part, index) => {
                  if (part.added) {
                    return (
                      <span key={index} className="bg-green-100 text-green-800 font-medium border-b-2 border-green-200 rounded-[2px] px-0.5">
                        {part.value}
                      </span>
                    );
                  }
                  if (part.removed) {
                    return null; // Hide removed text in modified view
                  }
                  return <span key={index}>{part.value}</span>;
                })}
              </div>
            </div>
          </div>
        ) : (
          // --- Unified View (Review Mode) ---
          <div className="p-8 bg-white">
            <div className="font-serif text-base leading-8 whitespace-pre-wrap text-slate-800 break-words">
              {diffResult.map((part, index) => {
                if (part.removed) {
                  return (
                    <span key={index} className="bg-red-50 text-red-600 line-through decoration-red-400/40 decoration-2 mx-0.5 px-0.5 rounded">
                      {part.value}
                    </span>
                  );
                }
                if (part.added) {
                  return (
                    <span key={index} className="bg-green-50 text-green-700 decoration-green-400/40 underline decoration-2 underline-offset-2 font-medium mx-0.5 px-0.5 rounded">
                      {part.value}
                    </span>
                  );
                }
                // Unchanged
                return <span key={index}>{part.value}</span>;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};