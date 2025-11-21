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

export type Persona = 'general' | 'interviewer' | 'academic' | 'reviewer' | 'reader';

export interface StoredKey {
  id: string;
  name: string;
  value: string;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
}
