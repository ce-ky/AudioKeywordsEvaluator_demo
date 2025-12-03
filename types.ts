export interface Keyword {
  id: string;
  text: string;
  detected: boolean;
  matchCount?: number;
}

export interface AnalysisResult {
  transcription: string;
  detectedKeywords: string[]; // List of keyword IDs or texts that were found
}

export enum AudioSourceType {
  UPLOAD = 'UPLOAD',
  MICROPHONE = 'MICROPHONE'
}

export type Language = 'zh' | 'en' | 'ja';
