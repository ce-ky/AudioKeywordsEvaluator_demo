import React, { useState, useRef, useEffect } from 'react';
import { Keyword } from '../types';
import { translations } from '../utils/translations';

interface KeywordManagerProps {
  keywords: Keyword[];
  setKeywords: React.Dispatch<React.SetStateAction<Keyword[]>>;
  isProcessing: boolean;
  hasAnalyzed: boolean;
  t: typeof translations['zh']['keywordManager'];
}

const KeywordManager: React.FC<KeywordManagerProps> = ({ keywords, setKeywords, isProcessing, hasAnalyzed, t }) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  // Helper: check if string is mostly ASCII (for 20 char limit) or CJK (10 char limit)
  const getCharLimit = (str: string) => {
    // If string contains only ASCII characters, limit is 20. Otherwise 10.
    const isAscii = /^[\x00-\xff]*$/.test(str);
    return isAscii ? 20 : 10;
  };

  const validateKeyword = (text: string, currentId?: string): string | null => {
    const trimmed = text.trim();
    if (!trimmed) return null;

    // Check duplicates
    if (keywords.some(k => k.text.toLowerCase() === trimmed.toLowerCase() && k.id !== currentId)) {
        return t.duplicateError;
    }

    // Check length
    const limit = getCharLimit(trimmed);
    if (trimmed.length > limit) {
        return t.maxCharError;
    }

    return null;
  };

  const addKeyword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newKeyword.trim();
    if (!trimmed) return;

    // Check Max Count (100)
    if (keywords.length >= 100) {
        alert(t.maxCountError);
        return;
    }

    const error = validateKeyword(trimmed);
    if (error) {
        alert(error);
        return;
    }

    const keyword: Keyword = {
      id: crypto.randomUUID(),
      text: trimmed,
      detected: false,
      matchCount: 0
    };

    setKeywords(prev => [...prev, keyword]);
    setNewKeyword('');
  };

  const removeKeyword = (id: string) => {
    setKeywords(prev => prev.filter(k => k.id !== id));
  };

  const startEditing = (k: Keyword) => {
    setEditingId(k.id);
    setEditText(k.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = () => {
    if (!editingId) return;
    const trimmed = editText.trim();
    
    if (!trimmed) {
        cancelEdit();
        return;
    }

    const error = validateKeyword(trimmed, editingId);
    if (error) {
        alert(error);
        return;
    }

    setKeywords(prev => prev.map(k => 
        k.id === editingId 
            ? { ...k, text: trimmed, detected: false, matchCount: 0 } 
            : k
    ));
    setEditingId(null);
    setEditText('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        saveEdit();
    } else if (e.key === 'Escape') {
        cancelEdit();
    }
  };

  const clearResults = () => {
    setKeywords(prev => prev.map(k => ({ ...k, detected: false, matchCount: 0 })));
  };

  // Calculate stats
  const detectedCount = keywords.filter(k => k.detected).length;
  const totalCount = keywords.length;
  const hitRate = totalCount > 0 ? Math.round((detectedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {t.title}
            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {keywords.length}/100
            </span>
        </h2>
        {keywords.length > 0 && (
             <button
                onClick={clearResults}
                disabled={isProcessing}
                className="text-xs text-slate-400 hover:text-indigo-600 font-medium transition-colors"
             >
                {t.reset}
             </button>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col overflow-hidden">
        
        {/* Hit Rate Stats Section */}
        {hasAnalyzed && totalCount > 0 && (
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-indigo-50/50 border border-indigo-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    {t.hitRate}
                </span>
                <div className="text-right">
                    <span className="text-2xl font-bold text-indigo-700">{hitRate}%</span>
                </div>
             </div>
             
             {/* Progress Bar */}
             <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden shadow-inner">
                <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${hitRate}%` }}
                ></div>
             </div>
             
             <div className="mt-2 flex justify-end">
                <span className="text-xs font-medium text-indigo-600 bg-indigo-100/50 px-2 py-0.5 rounded-md">
                   {detectedCount} / {totalCount}
                </span>
             </div>
          </div>
        )}

        <form onSubmit={addKeyword} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder={t.inputPlaceholder}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!newKeyword.trim() || isProcessing}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900 disabled:opacity-50 transition-colors"
          >
            {t.add}
          </button>
        </form>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {keywords.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <span className="text-3xl mb-2">🏷️</span>
                <p className="text-sm">{t.emptyState.title}</p>
                <p className="text-xs mt-1 opacity-70">{t.emptyState.desc}</p>
            </div>
          ) : (
            keywords.map((keyword) => (
              <div
                key={keyword.id}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                  keyword.detected
                    ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                    : 'bg-white border-slate-100 hover:border-slate-300'
                }`}
              >
                {editingId === keyword.id ? (
                    // Edit Mode
                    <div className="flex-1 flex items-center gap-2">
                        <input 
                            ref={editInputRef}
                            type="text" 
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button onClick={saveEdit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" aria-label={t.saveAria}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </button>
                        <button onClick={cancelEdit} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded" aria-label={t.cancelAria}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                ) : (
                    // View Mode
                    <>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${keyword.detected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                            <span className={`font-medium truncate ${keyword.detected ? 'text-emerald-900' : 'text-slate-700'}`}>
                                {keyword.text}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {keyword.detected && (
                                <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">
                                    {t.found}
                                </span>
                            )}
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => startEditing(keyword)}
                                    disabled={isProcessing}
                                    className="text-slate-400 hover:text-indigo-600 p-1 transition-colors"
                                    aria-label={t.editAria}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                </button>
                                <button
                                    onClick={() => removeKeyword(keyword.id)}
                                    disabled={isProcessing}
                                    className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                                    aria-label={t.deleteAria}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        </div>
                    </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default KeywordManager;