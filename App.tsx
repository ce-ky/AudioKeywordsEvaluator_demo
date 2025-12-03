
import React, { useState, useEffect } from 'react';
import AudioInput from './components/AudioInput';
import KeywordManager from './components/KeywordManager';
import { AnalysisStats } from './components/AnalysisStats';
import { Keyword, Language, SttProvider } from './types';
import { analyzeAudio, analyzeKeywordsWithLLM, translateTextList } from './services/geminiService';
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
  // Track detected audio language to enable cross-language matching
  const [audioLanguage, setAudioLanguage] = useState<string | null>(null);
  
  const [markedTranscription, setMarkedTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Store initial transcription from Web Speech API to bypass Gemini
  const [initialTranscription, setInitialTranscription] = useState<string | null>(null);
  // STT Provider State
  const [sttProvider, setSttProvider] = useState<SttProvider>('web_speech');

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

  const handleClearAudio = () => {
    setCurrentAudio(null);
    setTranscription(null);
    setAudioLanguage(null);
    setMarkedTranscription(null);
    setError(null);
    setHasAnalyzed(false);
    setInitialTranscription(null);
    setKeywords(prev => prev.map(k => ({ ...k, detected: false, matchCount: 0, fuzzyCount: 0, fuzzySegments: [], translatedText: undefined })));
  };

  const handleAudioReady = (blob: Blob, mimeType: string, text?: string) => {
    setCurrentAudio({ blob, mimeType });
    setTranscription(null);
    setAudioLanguage(null);
    setMarkedTranscription(null);
    setError(null);
    setHasAnalyzed(false); // Reset analysis state for new audio
    // Reset detection status when new audio is loaded
    setKeywords(prev => prev.map(k => ({ ...k, detected: false, matchCount: 0, fuzzyCount: 0, fuzzySegments: [], translatedText: undefined })));
    
    // If text is provided (from Web Speech API or Example), store it
    if (text) {
        setInitialTranscription(text);
        // For Web Speech, we assume the language is the one currently selected by the user
        // because Web Speech requires explicit language setting.
        setAudioLanguage(language);
    } else {
        setInitialTranscription(null);
    }
  };

  // Auto-transcribe whenever currentAudio or sttProvider changes
  useEffect(() => {
    const autoTranscribe = async () => {
      if (!currentAudio) return;

      // Special handling for Web Speech Pre-filled
      // If we already have initial text from Web Speech, we skip Gemini call.
      if (initialTranscription && sttProvider === 'web_speech') {
          // Immediate for Web Speech
          setTranscription(initialTranscription);
          setAudioLanguage(language); // Web speech uses current app language
          setMarkedTranscription(null);
          setError(null);
          setHasAnalyzed(false);
          setKeywords(prev => prev.map(k => ({ ...k, detected: false, matchCount: 0, fuzzyCount: 0, fuzzySegments: [], translatedText: undefined })));
          return;
      }

      // Logic for Gemini Provider (or Fallback if no initial text)
      setIsTranscribing(true);
      setError(null);
      setHasAnalyzed(false);
      setMarkedTranscription(null);
      setKeywords(prev => prev.map(k => ({ ...k, detected: false, matchCount: 0, fuzzyCount: 0, fuzzySegments: [], translatedText: undefined })));

      try {
        const base64Audio = await blobToBase64(currentAudio.blob);
        // Using Multilingual ASR - returns { text, language }
        const result = await analyzeAudio(base64Audio, currentAudio.mimeType);
        setTranscription(result.text);
        setAudioLanguage(result.language);
      } catch (err: any) {
        console.error("Transcription error:", err);
        setError(t.processError);
      } finally {
        setIsTranscribing(false);
      }
    };

    autoTranscribe();
  }, [currentAudio, initialTranscription, sttProvider, t.processError, language]);

  const resetResults = () => {
    setKeywords(prev => prev.map(k => ({ ...k, detected: false, matchCount: 0, fuzzyCount: 0, fuzzySegments: [], translatedText: undefined })));
  };

  const handleProcessAudio = async () => {
    if (!currentAudio) return;
    if (keywords.length === 0) {
        setError(t.noKeywordsError);
        return;
    }
    
    // If transcription failed or hasn't started yet (edge case)
    if (!transcription && !isTranscribing) {
        setError(t.processError); 
        return;
    }

    setIsProcessing(true);
    setError(null);

    try {
        if (!transcription) throw new Error("No transcription available");

        // --- Cross-Language Translation Logic ---
        let searchKeywords = [...keywords];
        
        // Map to store translated text (ID -> translatedText) to persist in state later
        const idToTranslatedText: Record<string, string> = {};

        // Detect if we need translation:
        // If we have detected audio language, and it doesn't match current UI language prefix
        const needsTranslation = audioLanguage && !audioLanguage.toLowerCase().startsWith(language.toLowerCase());

        if (needsTranslation) {
             console.log(`Language mismatch detected. App: ${language}, Audio: ${audioLanguage}. Translating keywords...`);
             const originalTexts = keywords.map(k => k.text);
             const translatedMap = await translateTextList(originalTexts, audioLanguage);
             
             // Update searchKeywords to use translated text
             searchKeywords = keywords.map(k => {
                 const translatedText = translatedMap[k.text] || k.text; // Fallback to original if translation fails
                 idToTranslatedText[k.id] = translatedText;
                 return { ...k, text: translatedText };
             });
        } else {
             // No translation needed
        }

        // 1. Client-side Fast Match (Exact Match)
        const normalizedTranscription = transcription.toLowerCase();
        
        // Map to store updates for keywords (ID -> Update Object)
        const updates: Record<string, Partial<Keyword>> = {};

        searchKeywords.forEach(sk => {
            const lowerKeyword = sk.text.toLowerCase();
            const isDetected = normalizedTranscription.includes(lowerKeyword);
            
            updates[sk.id] = {
                detected: isDetected,
                matchCount: isDetected ? 1 : 0,
                fuzzyCount: 0,
                fuzzySegments: []
            };
        });

        // 2. Filter keywords for LLM (Deep Semantic Match)
        // Optimization: Only send keywords that were NOT detected by exact match
        const keywordsForLLM = searchKeywords.filter(sk => !updates[sk.id]?.detected);

        // 3. Call Server-side LLM
        if (keywordsForLLM.length > 0) {
            const keywordTextsToSearch = keywordsForLLM.map(k => k.text);
            const result = await analyzeKeywordsWithLLM(transcription, keywordTextsToSearch);

            if (result) {
                setMarkedTranscription(result.marked_transcript);

                const analysisResults = result.analysis;
                if (analysisResults && analysisResults.length > 0) {
                    analysisResults.forEach(r => {
                        // r.object is the text used for searching (translated text if applicable)
                        // Find the corresponding original keyword ID.
                        const matchedSearchKeyword = searchKeywords.find(sk => sk.text === r.object);
                        
                        if (matchedSearchKeyword) {
                            const originalId = matchedSearchKeyword.id;
                            updates[originalId] = {
                                ...updates[originalId], 
                                detected: r.absolute_pair > 0, // LLM might find exact match client missed?
                                matchCount: r.absolute_pair,
                                fuzzyCount: r.blur_pair,
                                fuzzySegments: r.fuzzy_segments || []
                            };
                        }
                    });
                }
            }
        } else {
            // If all keywords matched exactly on client, we don't need LLM.
            // Clear marked transcription (or we could rely on client-side regex highlighting entirely)
            setMarkedTranscription(null);
        }

        // 4. Apply all updates to the original keywords state
        setKeywords(prev => prev.map(k => {
            const update = updates[k.id];
            const translatedText = idToTranslatedText[k.id];
            return { 
                ...k, 
                ...(update || {}),
                translatedText: translatedText // Persist translation for frontend Regex matching
            };
        }));

        setHasAnalyzed(true);

    } catch (err: any) {
        console.error(err);
        setError(t.processError);
    } finally {
        setIsProcessing(false);
    }
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
           {/* STT Provider Settings */}
           <div className="flex items-center gap-2 mr-2 border-r border-slate-200 pr-4">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:block">
                   {t.settings.label}
               </label>
               <select
                   value={sttProvider}
                   onChange={(e) => setSttProvider(e.target.value as SttProvider)}
                   className="appearance-none bg-indigo-50 border border-indigo-100 text-indigo-700 py-1.5 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 text-xs font-semibold cursor-pointer transition-colors"
               >
                   <option value="web_speech">{t.settings.providers.web_speech}</option>
                   <option value="gemini">{t.settings.providers.gemini}</option>
               </select>
           </div>

           {/* Language Selector */}
           <div className="relative">
              <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value as Language)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 text-sm font-medium cursor-pointer transition-colors hover:border-slate-300"
              >
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
           </div>
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
                    onClearAudio={handleClearAudio}
                    isProcessing={isProcessing}
                    t={t.audioInput}
                    transcription={transcription}
                    markedTranscription={markedTranscription}
                    isTranscribing={isTranscribing}
                    keywords={keywords}
                    language={language}
                    sttProvider={sttProvider}
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

        {/* Right Content: Stats & Keyword Manager */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 p-6 overflow-hidden">
            <div className="max-w-7xl w-full mx-auto h-full flex flex-col">
                {/* Stats Section - Separated */}
                {hasAnalyzed && (
                    <div className="flex-none">
                        <AnalysisStats 
                            keywords={keywords}
                            hasAnalyzed={hasAnalyzed}
                            t={t.keywordManager}
                            onReset={resetResults}
                            isProcessing={isProcessing}
                        />
                    </div>
                )}

                {/* Keyword List - Takes remaining space */}
                <section className="flex-1 min-h-0 flex flex-col transition-all duration-300">
                     <KeywordManager
                        keywords={keywords}
                        setKeywords={setKeywords}
                        isProcessing={isProcessing}
                        hasAnalyzed={hasAnalyzed}
                        t={t.keywordManager}
                      />
                </section>
            </div>
        </main>
      </div>

      {/* Fixed Bottom Footer for Action Button */}
      <footer className="flex-none bg-white border-t border-slate-200 p-4 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] flex justify-center">
        <button
            onClick={handleProcessAudio}
            disabled={!currentAudio || isProcessing || isTranscribing || !transcription}
            className={`w-full max-w-2xl py-3 rounded-xl font-bold text-white text-base shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 ${
                !currentAudio || isProcessing || isTranscribing || !transcription
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300'
            }`}
        >
            {isProcessing || isTranscribing ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isProcessing ? t.analyzingDeep : t.analyzing} 
                </>
            ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  {t.startAnalysis}
                </>
            )}
        </button>
      </footer>
    </div>
  );
};

export default App;
