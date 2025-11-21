import React, { useState, useEffect } from 'react';
import { KeyIcon, XMarkIcon, PlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { StoredKey } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: StoredKey[];
  setKeys: (keys: StoredKey[]) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, keys, setKeys }) => {
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [view, setView] = useState<'list' | 'add'>(keys.length === 0 ? 'add' : 'list');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setView(keys.length === 0 ? 'add' : 'list');
      setNewKeyName('');
      setNewKeyValue('');
    }
  }, [isOpen, keys.length]);

  if (!isOpen) return null;

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !newKeyValue.trim()) return;

    const newKey: StoredKey = {
      id: crypto.randomUUID(),
      name: newKeyName.trim(),
      value: newKeyValue.trim(),
      isActive: keys.length === 0 // Auto-activate if it's the first one
    };

    const updatedKeys = [...keys, newKey];
    setKeys(updatedKeys);
    setView('list');
    setNewKeyName('');
    setNewKeyValue('');
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
    // If we deleted the active one, activate the first available
    if (updatedKeys.length > 0 && !updatedKeys.some(k => k.isActive)) {
      updatedKeys[0].isActive = true;
    }
    setKeys(updatedKeys);
    if (updatedKeys.length === 0) setView('add');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
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
        <div className="p-6">
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
              
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {keys.map(key => (
                  <div 
                    key={key.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border ${key.isActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div 
                      className="flex-1 cursor-pointer" 
                      onClick={() => handleActivate(key.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{key.name}</span>
                        {key.isActive && <CheckCircleIcon className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
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
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Key Label</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Personal Key, Company Key"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Gemini API Key</label>
                <input
                  type="password"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono text-sm"
                />
              </div>
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
                  disabled={!newKeyName.trim() || !newKeyValue.trim()}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  Add Key
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
