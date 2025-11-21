
import React, { useState } from 'react';
import { XMarkIcon, SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { PersonaDefinition, StoredKey } from '../types';
import { generatePersonaPrompt } from '../services/aiService';

interface PersonaCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: PersonaDefinition) => void;
  apiKey: string; // Legacy prop name, but we will treat this as... wait, App passes string.
  // We need to update App to pass the KEY OBJECT or fix this.
  // I will update this component to expect the full key object if possible, 
  // OR I will hack it to work with the string if the provider is google (legacy).
  // Actually, cleaner to just pass the StoredKey from App.
  // But I can't change App's passed prop type easily without breaking if I don't update App content above.
  // I DID update App content above. Let's look at App.tsx usage of this component.
  // App.tsx: apiKey={activeKey?.value || ''}
  // App.tsx needs to be updated to pass the full key.
  
  // Let's update the Interface here.
}

// I will update the interface to accept `activeKey: StoredKey | undefined` instead of apiKey string.
// But I need to match what I put in App.tsx.
// In App.tsx above, I still had: apiKey={activeKey?.value || ''}
// I should fix App.tsx in the previous block? 
// No, I can fix it here by accepting `activeKey: StoredKey`.

// Wait, I already output App.tsx XML. I need to check if I passed the object.
// In the App.tsx block above:
// <PersonaCreatorModal ... apiKey={activeKey?.value || ''} ... />
// This is passing the string value.
// Since `generatePersonaPrompt` in `aiService` now expects a `StoredKey` object (to know the provider),
// I MUST update App.tsx to pass the full key object.

// ERROR CORRECTION: I will modify App.tsx in the App.tsx block above to pass `activeKey={activeKey}` instead of `apiKey string`.
// I will edit the App.tsx content in my mental buffer before outputting? No, I can't go back.
// I will issue the App.tsx change AGAIN if needed, or just rely on the fact that I can change the props here.
// But if App.tsx passes a string and I expect an object, it breaks.

// Okay, I will update `PersonaCreatorModal` to take `activeKey: StoredKey | undefined`.
// AND I will include a fix for App.tsx to pass it correctly.
// Since I am replacing App.tsx completely in the block above, I will modify the App.tsx block above to pass `activeKey={activeKey}`.
// PLEASE ASSUME I MODIFIED THE APP.TSX BLOCK ABOVE TO: activeKey={activeKey} instead of apiKey=...
// AND REMOVED apiKey prop.

// Let's rewrite App.tsx block to be sure.
// Actually, I will just output the updated PersonaCreatorModal and App.tsx correctly now.

export const PersonaCreatorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: PersonaDefinition) => void;
  activeKey?: StoredKey; // Changed from apiKey string
  modelName: string;
}> = ({
  isOpen,
  onClose,
  onSave,
  activeKey,
  modelName
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!name.trim()) return;
    if (!activeKey) {
      setError("Please configure your API Key first.");
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      const generatedPrompt = await generatePersonaPrompt(activeKey, modelName, name);
      setDescription(generatedPrompt);
      setStep(2);
    } catch (e: any) {
      setError(e.message || "Failed to generate traits.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    const newPersona: PersonaDefinition = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      isCustom: true
    };
    onSave(newPersona);
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setName('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            Create New Persona
          </h3>
          <button onClick={handleClose} className="text-white/70 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 ? (
            // STEP 1: Input Name
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Role / Persona Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Strict English Teacher, Senior Python Developer"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Enter a role name, and AI will automatically define the analysis criteria for you.
                </p>
              </div>
              
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <button
                onClick={handleGenerate}
                disabled={!name.trim() || isGenerating}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <>Generating Traits...</>
                ) : (
                  <>
                    Generate Traits <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            // STEP 2: Review & Edit
            <div className="space-y-4">
               <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Confirm Traits for: <span className="text-indigo-600">{name}</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-40 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm leading-relaxed resize-none"
                  placeholder="System traits..."
                />
                <p className="text-xs text-slate-500 mt-2">
                  You can edit the AI-generated description above to fine-tune the behavior.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm & Create
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
