
export interface Keyword {
  id: string;
  text: string;
  detected: boolean;
  matchCount?: number;
  fuzzyCount?: number;
  fuzzySegments?: string[]; // The actual text segments from transcription that matched fuzzily
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

export type SttProvider = 'web_speech' | 'gemini';

// Web Speech API Type Definitions
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
    length: number;
    isFinal: boolean;
  };
}

export interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}