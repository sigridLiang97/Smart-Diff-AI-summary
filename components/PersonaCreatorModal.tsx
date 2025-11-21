
import React, { useState } from 'react';
import { XMarkIcon, SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { PersonaDefinition } from '../types';
import { generatePersonaPrompt } from '../services/geminiService';

interface PersonaCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: PersonaDefinition) => void;
  apiKey: string;
  modelName: string;
}

export const PersonaCreatorModal: React.FC<PersonaCreatorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  apiKey,
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
    if (!apiKey) {
      setError("Please configure your API Key first.");
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      const generatedPrompt = await generatePersonaPrompt(apiKey, modelName, name);
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
                  placeholder="e.g. Strict English Teacher, Senior Python Developer, Marketing Specialist"
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
