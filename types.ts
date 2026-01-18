
export interface GoalStep {
  title: string;
  description: string;
}

export interface GoalDescription {
  shortDescription: string;
  motivation: string;
  steps: GoalStep[];
}

export type SupportedLanguage = 'English' | 'Chinese' | 'Japanese' | 'Spanish' | 'French';

export interface AiSettings {
  model: 'gemini-3-flash-preview' | 'gemini-3-pro-preview';
  customInstructions: string;
  language: SupportedLanguage;
}

export interface HistoryItem {
  id: string;
  goal: string;
  result: GoalDescription;
  stepSolutions: Record<number, string>;
  settings: AiSettings;
  createdAt: number;
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
