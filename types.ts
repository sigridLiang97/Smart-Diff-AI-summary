
export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface AnalysisResult {
  summary: string;
  tone?: string;
}

export enum AppState {
  EDITING = 'EDITING',
  COMPARING = 'COMPARING'
}

// --- New Types for Advanced Features ---

export interface PersonaDefinition {
  id: string;
  name: string;
  description: string; // This acts as the system prompt
  isCustom?: boolean;
}

export type AIProvider = 'google' | 'openai' | 'deepseek' | 'custom';

export interface StoredKey {
  id: string;
  name: string;
  value: string;
  provider: AIProvider;
  baseUrl?: string;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalText: string;
  modifiedText: string;
  persona: PersonaDefinition;
  question: string;
  messages: ChatMessage[];
}
