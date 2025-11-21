
import React, { useState, useEffect } from 'react';
import { KeyIcon, XMarkIcon, PlusIcon, TrashIcon, CheckCircleIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { StoredKey, AIProvider } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: StoredKey[];
  setKeys: (keys: StoredKey[]) => void;
}

const PROVIDERS: { id: AIProvider; name: string; defaultBaseUrl?: string }[] = [
  { id: 'google', name: 'Google Gemini' },
  { id: 'openai', name: 'OpenAI', defaultBaseUrl: 'https://api.openai.com/v1' },
  { id: 'deepseek', name: 'DeepSeek', defaultBaseUrl: 'https://api.deepseek.com' },
  { id: 'custom', name: 'Custom / OneAPI' },
];

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, keys, setKeys }) => {
  const [view, setView] = useState<'list' | 'add'>(keys.length === 0 ? 'add' : 'list');
  
  // Add Form State
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [provider, setProvider] = useState<AIProvider>('google');
  const [baseUrl, setBaseUrl] = useState('');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setView(keys.length === 0 ? 'add' : 'list');
      resetForm();
    }
  }, [isOpen, keys.length]);

  const resetForm = () => {
    setName('');
    setValue('');
    setProvider('google');
    setBaseUrl('');
  };

  if (!isOpen) return null;

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !value.trim()) return;

    const newKey: StoredKey = {
      id: crypto.randomUUID(),
      name: name.trim(),
      value: value.trim(),
      provider: provider,
      baseUrl: baseUrl.trim() || undefined,
      isActive: keys.length === 0 // Auto-activate if it's the first one
    };

    const updatedKeys = [...keys, newKey];
    setKeys(updatedKeys);
    setView('list');
    resetForm();
  };

  const handleActivate = (id: string) => {
    const updatedKeys = keys.map(k => ({
      ...k,
      isActive: k.id === id
    }));
    setKeys(updatedKeys);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this API Key?')) return;
    const updatedKeys = keys.filter(k => k.id !== id);
    if (updatedKeys.length > 0 && !updatedKeys.some(k => k.isActive)) {
      updatedKeys[0].isActive = true;
    }
    setKeys(updatedKeys);
    if (updatedKeys.length === 0) setView('add');
  };

  const getProviderBadge = (p: AIProvider) => {
    switch(p) {
      case 'google': return 'bg-blue-100 text-blue-700';
      case 'openai': return 'bg-green-100 text-green-700';
      case 'deepseek': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <KeyIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">API Key Management</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
            type="button"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {view === 'list' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-slate-700 uppercase">Your Keys</h4>
                <button 
                  onClick={() => setView('add')}
                  className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800"
                >
                  <PlusIcon className="w-4 h-4" /> Add New
                </button>
              </div>
              
              <div className="space-y-2">
                {keys.map(key => (
                  <div 
                    key={key.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border ${key.isActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div 
                      className="flex-1 cursor-pointer" 
                      onClick={() => handleActivate(key.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-800">{key.name}</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getProviderBadge(key.provider || 'google')}`}>
                          {key.provider || 'google'}
                        </span>
                        {key.isActive && <CheckCircleIcon className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {key.value.substring(0, 8)}...
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(key.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete Key"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddKey} className="space-y-4">
              {/* Provider Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value as AIProvider);
                    setBaseUrl(''); // Reset URL when changing provider
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Label / Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My Gemini Key"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">API Key</label>
                <input
                  type="password"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                />
              </div>

              {/* Base URL (Conditional) */}
              {(provider !== 'google') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <GlobeAltIcon className="w-3 h-3" /> API Base URL {provider !== 'custom' && '(Optional)'}
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={
                      provider === 'openai' ? 'https://api.openai.com/v1' :
                      provider === 'deepseek' ? 'https://api.deepseek.com' : 
                      'https://your-custom-api.com/v1'
                    }
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {keys.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!name.trim() || !value.trim()}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  Save Key
                </button>
              </div>
            </form>
          )}
          
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Keys are stored locally in your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
