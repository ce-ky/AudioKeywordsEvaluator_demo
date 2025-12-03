
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AudioSourceType, Keyword, Language, SttProvider } from '../types';
import { formatDuration } from '../utils/audioUtils';
import { translations } from '../utils/translations';

interface AudioInputProps {
  onAudioReady: (blob: Blob, type: string, text?: string) => void;
  onClearAudio: () => void;
  isProcessing: boolean;
  t: typeof translations['zh']['audioInput'];
  transcription: string | null;
  markedTranscription?: string | null;
  isTranscribing: boolean;
  keywords: Keyword[];
  language: Language;
  sttProvider: SttProvider;
}

const MAX_RECORDING_TIME = 1800; // 30 minutes in seconds

const AudioInput: React.FC<AudioInputProps> = ({ 
    onAudioReady, 
    onClearAudio,
    isProcessing, 
    t, 
    transcription,
    markedTranscription,
    isTranscribing,
    keywords,
    language,
    sttProvider
}) => {
  const [mode, setMode] = useState<AudioSourceType>(AudioSourceType.MICROPHONE);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isTranscriptionExpanded, setIsTranscriptionExpanded] = useState(false);
  const [isLoadingExample, setIsLoadingExample] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");

  // Map app language to Web Speech API language codes
  const getLangCode = (lang: Language) => {
    switch (lang) {
      case 'zh': return 'zh-CN';
      case 'en': return 'en-US';
      case 'ja': return 'ja-JP';
      default: return 'zh-CN';
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-expand transcription when it becomes available
  useEffect(() => {
    if (transcription) {
        setIsTranscriptionExpanded(true);
    }
  }, [transcription]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const stopRecording = () => {
    // Stop Media Recorder
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    // Stop Speech Recognition regardless, just to be safe
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Watch for recording time limit
  useEffect(() => {
    if (isRecording && recordingTime >= MAX_RECORDING_TIME) {
        stopRecording();
        alert(t.timeLimitReached);
    }
  }, [recordingTime, isRecording, t.timeLimitReached]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Reset transcript
      transcriptRef.current = "";

      // Start Web Speech API Recognition ONLY if provider is web_speech
      if (sttProvider === 'web_speech' && recognitionRef.current) {
        recognitionRef.current.lang = getLangCode(language);
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            transcriptRef.current += finalTranscript;
          }
        };
        try {
            recognitionRef.current.start();
        } catch(e) {
            console.warn("Recognition already started or error", e);
        }
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Pass the blob.
        // If we are in Web Speech mode, pass the captured text.
        // If we are in Gemini mode, pass undefined for text (App will handle API call).
        const capturedText = (sttProvider === 'web_speech' && transcriptRef.current.trim().length > 0) 
            ? transcriptRef.current 
            : undefined;
            
        onAudioReady(audioBlob, 'audio/webm', capturedText);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAudioUrl(null); // Clear previous
      setFileName(null);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(t.permissionPrompt);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setFileName(file.name);
      // Files never have pre-captured text from Web Speech API
      onAudioReady(file, file.type);
    }
    // Reset input so same file can be selected again if removed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setFileName(null);
      onClearAudio();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (mode === AudioSourceType.UPLOAD) {
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('audio/')) {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const url = URL.createObjectURL(file);
        setAudioUrl(url);
        setFileName(file.name);
        onAudioReady(file, file.type);
      }
    }
  }, [mode, audioUrl, onAudioReady]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const loadExampleCase = async () => {
      setIsLoadingExample(true);
      try {
        const response = await fetch('examples/recording.m4a');
        if (!response.ok) {
            throw new Error(`Failed to load example file: ${response.statusText}`);
        }
        const blob = await response.blob();
        
        // M4A is typically audio/mp4 or audio/x-m4a
        const file = new File([blob], 'recording.m4a', { type: 'audio/mp4' });
        
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Use translation name for display, but keep extension accurate to what we just loaded
        setFileName(t.exampleCase.fileName);
        
        onAudioReady(blob, file.type);
      } catch (error) {
          console.error("Error loading example case:", error);
          alert("无法加载示例文件 (examples/recording.m4a)。请确保文件存在于服务器上。");
      } finally {
          setIsLoadingExample(false);
      }
  };

  const renderTranscriptionContent = () => {
    if (!transcription) return null;

    // 1. Use Marked Transcription if available (Server-side precise & fuzzy highlighting)
    if (markedTranscription) {
        // Regex to split by tags [e]...[/e] and [f]...[/f]
        // Captures including tags to identify type
        const parts = markedTranscription.split(/(\[e\].*?\[\/e\]|\[f\].*?\[\/f\])/gs);

        return parts.map((part, i) => {
            if (part.startsWith('[e]')) {
                const content = part.replace('[e]', '').replace('[/e]', '');
                return (
                    <span key={i} className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded mx-0.5 font-semibold border-b-2 border-emerald-300">
                        {content}
                    </span>
                );
            } else if (part.startsWith('[f]')) {
                const content = part.replace('[f]', '').replace('[/f]', '');
                return (
                    <span key={i} className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded mx-0.5 font-semibold border-b-2 border-amber-300">
                        {content}
                    </span>
                );
            } else {
                return <span key={i}>{part}</span>;
            }
        });
    }

    // 2. Fallback: Client-side highlighting (Exact matches only initially, plus fuzzy segments if any)
    const exactKeywords = keywords.filter(k => k.detected);
    const fuzzySegments = keywords.flatMap(k => k.fuzzySegments || []);

    // If no keywords found, just return text
    if (exactKeywords.length === 0 && fuzzySegments.length === 0) {
        return <span>{transcription}</span>;
    }

    // Combine all phrases to match (exact + fuzzy)
    const exactPhrases = exactKeywords.map(k => k.text);
    const allPhrases = [...exactPhrases, ...fuzzySegments];
    
    // De-duplicate and sort by length (longest first to avoid partial matches inside longer words)
    const uniquePhrases = Array.from(new Set(allPhrases)).sort((a, b) => b.length - a.length);

    if (uniquePhrases.length === 0) return <span>{transcription}</span>;

    // Create regex to split by keywords for highlighting
    // Escape regex special characters
    const pattern = `(${uniquePhrases.map(text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`;
    const regex = new RegExp(pattern, 'gi');

    return transcription.split(regex).map((part, i) => {
        const lowerPart = part.toLowerCase();
        
        // Check for Exact Match (Green)
        const isExactMatch = exactPhrases.some(text => text.toLowerCase() === lowerPart);
        if (isExactMatch) {
            return (
                <span key={i} className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded mx-0.5 font-semibold border-b-2 border-emerald-300">
                    {part}
                </span>
            );
        }

        // Check for Fuzzy Match (Yellow/Amber)
        const isFuzzyMatch = fuzzySegments.some(text => text.toLowerCase() === lowerPart);
        if (isFuzzyMatch) {
            return (
                <span key={i} className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded mx-0.5 font-semibold border-b-2 border-amber-300">
                    {part}
                </span>
            );
        }

        return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col w-full">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 flex-none">
        <button
          onClick={() => {
            if (!isRecording) {
                setMode(AudioSourceType.MICROPHONE);
                // Don't clear audioUrl here if switching tabs, user might want to keep the file?
                // Usually tabs act as "New Source", so clearing is safer to avoid state confusion.
                if (audioUrl) handleRemoveFile();
            }
          }}
          className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            mode === AudioSourceType.MICROPHONE
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isRecording}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
          {t.tabs.record}
        </button>
        <button
          onClick={() => {
              if(!isRecording) {
                  setMode(AudioSourceType.UPLOAD);
                  // Don't clear audioUrl if switching back to upload tab? 
                  // But we cleared it on switching TO Mic. So it is clear.
              }
          }}
          className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            mode === AudioSourceType.UPLOAD
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isRecording}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          {t.tabs.upload}
        </button>
      </div>

      <div className="p-3 flex-1 flex flex-col items-center justify-center"
           onDrop={handleDrop}
           onDragOver={handleDragOver}
      >
        {mode === AudioSourceType.MICROPHONE ? (
          <div className="flex flex-col items-center gap-3 w-full max-w-sm py-2">
            <div className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-50' : 'bg-slate-50'}`}>
              {isRecording && (
                <div className="absolute inset-0 rounded-full animate-ping bg-red-100 opacity-75"></div>
              )}
              <div className={`text-base font-mono ${isRecording ? 'text-red-500' : 'text-slate-400'}`}>
                {isRecording ? formatDuration(recordingTime) : '0:00'}
              </div>
            </div>

            {isRecording ? (
              <button
                onClick={stopRecording}
                className="w-full py-2 px-6 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium shadow-md shadow-red-200 transition-all active:scale-95 text-sm"
              >
                {t.recording}
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={isProcessing || isTranscribing}
                className="w-full py-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {t.startRecording}
              </button>
            )}
             <p className="text-[10px] text-slate-400 text-center">
                {t.permissionPrompt}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full max-w-sm py-2">
             {!audioUrl ? (
                 <>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all group"
                    >
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-white group-hover:shadow-md transition-all text-slate-400 group-hover:text-indigo-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <p className="text-slate-600 font-medium mb-1 text-xs">{t.uploadPrompt}</p>
                        <p className="text-[10px] text-slate-400">{t.uploadDesc}</p>
                    </div>

                    {/* Example Case Section */}
                    <div className="w-full mt-1">
                        <div className="flex items-center gap-2 mb-2 mt-2">
                            <div className="h-px bg-slate-100 flex-1"></div>
                            <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">{t.exampleCase.title}</span>
                            <div className="h-px bg-slate-100 flex-1"></div>
                        </div>
                        <button 
                            onClick={loadExampleCase}
                            disabled={isLoadingExample}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-3 hover:border-indigo-300 hover:shadow-sm transition-all text-left group disabled:opacity-70 disabled:cursor-wait"
                        >
                            <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-amber-100">
                                {isLoadingExample ? (
                                    <svg className="animate-spin h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors truncate">{t.exampleCase.fileName}</p>
                                <p className="text-[10px] text-slate-400 font-medium">M4A • Example</p>
                            </div>
                            <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                 </>
             ) : (
                 // File Info Card with Remove Button
                 <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                     <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                        </div>
                        <span className="text-xs font-medium text-slate-700 truncate" title={fileName || ''}>{fileName}</span>
                     </div>
                     <button 
                        onClick={handleRemoveFile}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={t.removeFile}
                     >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                     </button>
                 </div>
             )}
             
             <input
                type="file"
                accept="audio/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
          </div>
        )}

        {/* Audio Player */}
        {audioUrl && !isRecording && (
          <div className="w-full mt-2 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.previewTitle}</p>
            <audio controls src={audioUrl} className="w-full h-8 rounded-lg mb-3" />

            {/* Integrated Transcription Section */}
            {(transcription || isTranscribing) && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden">
                <button
                  onClick={() => setIsTranscriptionExpanded(!isTranscriptionExpanded)}
                  disabled={isTranscribing}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    {isTranscribing ? (
                      <svg className="animate-spin h-3.5 w-3.5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <span className="text-indigo-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-700">
                      {isTranscribing ? t.transcribing : t.transcriptionTitle}
                    </span>
                  </div>
                  {!isTranscribing && (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wide">
                        {isTranscriptionExpanded ? t.clickToCollapse : t.clickToExpand}
                      </span>
                      <svg
                        className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${isTranscriptionExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  )}
                </button>

                {/* Collapsible Content */}
                {transcription && isTranscriptionExpanded && (
                  <div className="border-t border-slate-200 bg-white">
                    <div className="p-3 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                      {renderTranscriptionContent()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioInput;
