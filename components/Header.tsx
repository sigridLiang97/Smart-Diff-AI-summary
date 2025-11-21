
import React from 'react';
import { ArrowPathIcon, CpuChipIcon, KeyIcon, ClockIcon } from '@heroicons/react/24/outline';
import { AIProvider } from '../types';

interface HeaderProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  activeProvider?: AIProvider;
}

export const Header: React.FC<HeaderProps> = ({ selectedModel, onModelChange, onOpenSettings, onOpenHistory, activeProvider = 'google' }) => {
  
  const renderModelOptions = () => {
    switch(activeProvider) {
      case 'openai':
        return (
          <>
            <option value="gpt-4o">GPT-4o (Best)</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</option>
          </>
        );
      case 'deepseek':
        return (
          <>
            <option value="deepseek-chat">DeepSeek V3 (Chat)</option>
            <option value="deepseek-reasoner">DeepSeek R1 (Reasoner)</option>
          </>
        );
      case 'custom':
        return (
           <>
            <option value="gpt-4o">GPT-4o Compatible</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Compatible</option>
           </>
        );
      case 'google':
      default:
        return (
          <>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast & Free)</option>
            <option value="gemini-3-pro-preview">Gemini 3.0 Pro (High Intelligence)</option>
          </>
        );
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <ArrowPathIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            TextDiff <span className="text-indigo-600 font-medium">& AI Summary</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Model Selector */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <CpuChipIcon className="w-4 h-4 text-slate-500" />
            <select 
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer max-w-[150px] sm:max-w-none"
            >
              {renderModelOptions()}
            </select>
          </div>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg transition-colors text-sm font-medium shadow-sm"
            title="View Analysis History"
          >
            <ClockIcon className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* API Key Settings */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg transition-colors text-sm font-medium shadow-sm"
            title="Configure API Key"
          >
            <KeyIcon className="w-4 h-4" />
            <span className="hidden sm:inline">API Key</span>
          </button>
        </div>
      </div>
    </header>
  );
};
