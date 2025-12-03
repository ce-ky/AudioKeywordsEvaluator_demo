import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AudioSourceType, Keyword } from '../types';
import { formatDuration } from '../utils/audioUtils';
import { translations } from '../utils/translations';

interface AudioInputProps {
  onAudioReady: (blob: Blob, type: string) => void;
  isProcessing: boolean;
  t: typeof translations['zh']['audioInput'];
  transcription: string | null;
  isTranscribing: boolean;
  keywords: Keyword[];
}

const AudioInput: React.FC<AudioInputProps> = ({ 
    onAudioReady, 
    isProcessing, 
    t, 
    transcription, 
    isTranscribing,
    keywords 
}) => {
  const [mode, setMode] = useState<AudioSourceType>(AudioSourceType.MICROPHONE);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isTranscriptionExpanded, setIsTranscriptionExpanded] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onAudioReady(audioBlob, 'audio/webm');
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setFileName(file.name);
      onAudioReady(file, file.type);
    }
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

  const renderTranscriptionContent = () => {
    if (!transcription) return null;

    const detectedKeywords = keywords.filter(k => k.detected);
    
    // If no keywords found, just return text
    if (detectedKeywords.length === 0) {
        return <span>{transcription}</span>;
    }

    // Create regex to split by keywords for highlighting
    // Escape regex special characters in keywords
    const pattern = `(${detectedKeywords.map(k => k.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`;
    const regex = new RegExp(pattern, 'gi');

    return transcription.split(regex).map((part, i) => {
        const isMatch = keywords.some(k => k.detected && k.text.toLowerCase() === part.toLowerCase());
        return isMatch ? (
            <span key={i} className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded mx-0.5 font-semibold border-b-2 border-emerald-300">
                {part}
            </span>
        ) : (
            <span key={i}>{part}</span>
        );
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
                setAudioUrl(null);
            }
          }}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            mode === AudioSourceType.MICROPHONE
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isRecording}
        >
          {t.tabs.record}
        </button>
        <button
          onClick={() => {
              if(!isRecording) {
                  setMode(AudioSourceType.UPLOAD);
                  setAudioUrl(null);
              }
          }}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            mode === AudioSourceType.UPLOAD
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isRecording}
        >
          {t.tabs.upload}
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col items-center justify-center"
           onDrop={handleDrop}
           onDragOver={handleDragOver}
      >
        {mode === AudioSourceType.MICROPHONE ? (
          <div className="flex flex-col items-center gap-6 w-full max-w-sm py-8">
            <div className={`relative flex items-center justify-center w-32 h-32 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-50' : 'bg-slate-50'}`}>
              {isRecording && (
                <div className="absolute inset-0 rounded-full animate-ping bg-red-100 opacity-75"></div>
              )}
              <div className={`text-4xl ${isRecording ? 'text-red-500' : 'text-slate-400'}`}>
                {isRecording ? formatDuration(recordingTime) : '0:00'}
              </div>
            </div>

            {isRecording ? (
              <button
                onClick={stopRecording}
                className="w-full py-3 px-6 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-lg shadow-red-200 transition-all active:scale-95"
              >
                {t.recording}
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={isProcessing || isTranscribing}
                className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.startRecording}
              </button>
            )}
             <p className="text-xs text-slate-400 text-center">
                {t.permissionPrompt}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full max-w-sm py-8">
             <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all group"
             >
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-md transition-all">
                   <span className="text-2xl">📁</span>
                </div>
                <p className="text-slate-600 font-medium mb-1">{fileName || t.uploadPrompt}</p>
                <p className="text-xs text-slate-400">{t.uploadDesc}</p>
             </div>
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
          <div className="w-full mt-4 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t.previewTitle}</p>
            <audio controls src={audioUrl} className="w-full rounded-lg mb-6" />

            {/* Integrated Transcription Section */}
            {(transcription || isTranscribing) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                <button
                  onClick={() => setIsTranscriptionExpanded(!isTranscriptionExpanded)}
                  disabled={isTranscribing}
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    {isTranscribing ? (
                      <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <span className="text-indigo-600">📝</span>
                    )}
                    <span className="text-sm font-semibold text-slate-700">
                      {isTranscribing ? t.transcribing : t.transcriptionTitle}
                    </span>
                  </div>
                  {!isTranscribing && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                        {isTranscriptionExpanded ? t.clickToCollapse : t.clickToExpand}
                      </span>
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isTranscriptionExpanded ? 'rotate-180' : ''}`}
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
                    <div className="p-4 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
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