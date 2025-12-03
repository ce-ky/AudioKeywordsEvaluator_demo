import React, { useState, useEffect } from 'react';
import AudioInput from './components/AudioInput';
import KeywordManager from './components/KeywordManager';
import { Keyword, Language } from './types';
import { analyzeAudio } from './services/geminiService';
import { blobToBase64 } from './utils/audioUtils';
import { translations, INITIAL_KEYWORDS_BY_LANG } from './utils/translations';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('zh');
  // Initialize with Chinese keywords by default
  const [keywords, setKeywords] = useState<Keyword[]>(INITIAL_KEYWORDS_BY_LANG['zh']);
  const [currentAudio, setCurrentAudio] = useState<{ blob: Blob; mimeType: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // Used for keyword matching visual feedback
  const [isTranscribing, setIsTranscribing] = useState(false); // Used for API call status
  const [hasAnalyzed, setHasAnalyzed] = useState(false); // Track if analysis has been performed on current audio
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = translations[language];

  // Helper to check if two keyword arrays are identical (used to detect if user is still on default)
  const isDefaultList = (current: Keyword[], lang: Language) => {
    const defaults = INITIAL_KEYWORDS_BY_LANG[lang];
    if (current.length !== defaults.length) return false;
    // Check if texts match (ignore detection status)
    return current.every((k, i) => k.text === defaults[i].text);
  };

  const handleLanguageChange = (newLang: Language) => {
    // If the current keywords match the *previous* language's default list (meaning user hasn't customized them),
    // automatically switch to the new language's default list for a better demo experience.
    if (isDefaultList(keywords, language)) {
      setKeywords(INITIAL_KEYWORDS_BY_LANG[newLang]);
    }
    setLanguage(newLang);
  };

  const handleAudioReady = (blob: Blob, mimeType: string) => {
    setCurrentAudio({ blob, mimeType });
    setTranscription(null);
    setError(null);
    setHasAnalyzed(false); // Reset analysis state for new audio
    // Reset detection status when new audio is loaded
    setKeywords(prev => prev.map(k => ({ ...k, detected: false, matchCount: 0 })));
  };

  // Auto-transcribe whenever currentAudio changes
  useEffect(() => {
    const autoTranscribe = async () => {
      if (!currentAudio) return;

      setIsTranscribing(true);
      setError(null);
      try {
        const base64Audio = await blobToBase64(currentAudio.blob);
        const resultText = await analyzeAudio(base64Audio, currentAudio.mimeType);
        setTranscription(resultText);
      } catch (err: any) {
        console.error("Transcription error:", err);
        setError(t.processError);
      } finally {
        setIsTranscribing(false);
      }
    };

    autoTranscribe();
  }, [currentAudio, t.processError]);

  const handleProcessAudio = async () => {
    // This now only triggers the keyword matching highlight logic
    if (!currentAudio) return;
    if (keywords.length === 0) {
        setError(t.noKeywordsError);
        return;
    }
    
    // If transcription failed or hasn't started yet (edge case)
    if (!transcription && !isTranscribing) {
        setError(t.processError); // Or a specific error about missing transcription
        return;
    }

    setIsProcessing(true);
    setError(null);

    // Simulate a brief processing delay for visual feedback, 
    // since client-side matching is instant
    setTimeout(() => {
      try {
        if (!transcription) {
            throw new Error("No transcription available");
        }

        const normalizedTranscription = transcription.toLowerCase();

        // Update keywords detected status
        const updatedKeywords = keywords.map(keyword => {
            const lowerKeyword = keyword.text.toLowerCase();
            const isDetected = normalizedTranscription.includes(lowerKeyword);
            return {
              ...keyword,
              detected: isDetected,
              matchCount: isDetected ? 1 : 0 // Simple boolean match for now
            };
        });
        setKeywords(updatedKeywords);
        setHasAnalyzed(true); // Enable stats display

      } catch (err: any) {
        setError(t.processError);
      } finally {
        setIsProcessing(false);
      }
    }, 500);
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      {/* Header - Fixed Height */}
      <header className="flex-none bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            AI
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {t.title} <span className="text-indigo-600">{t.titleSuffix}</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
           {/* Language Selector */}
           <div className="relative">
              <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value as Language)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 text-sm font-medium cursor-pointer transition-colors hover:border-slate-300"
              >
                  <option value="zh">🇨🇳 中文</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="ja">🇯🇵 日本語</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
           </div>

           <div className="h-6 w-px bg-slate-200"></div>

           {/* Analysis Button - Global Action */}
           <button
              onClick={handleProcessAudio}
              disabled={!currentAudio || isProcessing || isTranscribing || !transcription}
              className={`px-6 py-2 rounded-lg font-bold text-white text-sm shadow-md transition-all transform active:scale-95 flex items-center gap-2 ${
                  !currentAudio || isProcessing || isTranscribing || !transcription
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              }`}
          >
              {isProcessing || isTranscribing ? (
                  <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isTranscribing ? t.analyzing : t.analyzing} 
                  </>
              ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    {t.startAnalysis}
                  </>
              )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Audio Input & Transcription (Fixed Width) */}
        <aside className="w-[400px] flex-none bg-white border-r border-slate-200 flex flex-col z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Audio Input Section (Includes Transcription now) */}
              <div className="shrink-0">
                <AudioInput
                    onAudioReady={handleAudioReady}
                    isProcessing={isProcessing}
                    t={t.audioInput}
                    transcription={transcription}
                    isTranscribing={isTranscribing}
                    keywords={keywords}
                />
              </div>
              
              {/* Error Display in Sidebar */}
              {error && (
                <div className="shrink-0 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 text-sm shadow-sm">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <div>
                        <p className="font-bold">{t.errorTitle}</p>
                        <p className="mt-1 opacity-90">{error}</p>
                    </div>
                </div>
              )}
           </div>
        </aside>

        {/* Right Content: Keyword Manager Only */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 p-6 gap-6 overflow-hidden">
            <section className="flex-1 min-h-0 flex flex-col transition-all duration-300">
                 <KeywordManager
                    keywords={keywords}
                    setKeywords={setKeywords}
                    isProcessing={isProcessing}
                    hasAnalyzed={hasAnalyzed}
                    t={t.keywordManager}
                  />
            </section>
        </main>
      </div>
    </div>
  );
};

export default App;