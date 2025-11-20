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
