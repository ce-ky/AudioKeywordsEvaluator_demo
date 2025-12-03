
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
  // Add Mode State
  const [isAdding, setIsAdding] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when adding mode starts
  useEffect(() => {
    if (isAdding && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAdding]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  // Helper: check if string is mostly ASCII (for 20 char limit) or CJK (10 char limit)
  const getCharLimit = (str: string) => {
    const isAscii = /^[\x00-\xff]*$/.test(str);
    return isAscii ? 20 : 10;
  };

  // Helper to render character count indicator
  const renderCharCount = (text: string) => {
    if (!text) return null;
    const limit = getCharLimit(text);
    const length = text.length;
    const isOver = length > limit;
    
    return (
      <span className={`text-[10px] font-mono pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 transition-colors ${isOver ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
        {length}/{limit}
      </span>
    );
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

  const submitAddKeyword = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) {
        setIsAdding(false);
        return;
    }

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
      matchCount: 0,
      fuzzyCount: 0
    };

    setKeywords(prev => [keyword, ...prev]); // Add to beginning of list
    setNewKeyword('');
    setIsAdding(false);
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          submitAddKeyword();
      } else if (e.key === 'Escape') {
          setIsAdding(false);
          setNewKeyword('');
      }
  };

  const removeKeyword = (id: string) => {
    setKeywords(prev => prev.filter(k => k.id !== id));
  };

  const startEditing = (k: Keyword) => {
    setEditingId(k.id);
    setEditText(k.text);
    setIsAdding(false); // Close add mode if open
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
            ? { ...k, text: trimmed, detected: false, matchCount: 0, fuzzyCount: 0 } 
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col relative overflow-hidden">
      {/* Header Container */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-20 sticky top-0 min-h-[64px] relative">
        
        {/* Title - Always Visible */}
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            {t.title}
            <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {keywords.length}/100
            </span>
        </h2>

        {/* Add Button - Visible only when NOT adding */}
        {!isAdding && (
            <button
                onClick={() => setIsAdding(true)}
                disabled={isProcessing}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-all active:scale-95"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                {t.add}
            </button>
        )}

        {/* Add Input Overlay - Visible when adding (Occupies right half) */}
        {isAdding && (
             <div className="absolute right-0 top-0 bottom-0 z-30 w-full md:w-1/2 bg-white md:border-l border-slate-100 px-3 flex items-center gap-2 animate-in slide-in-from-right-8 duration-200">
                <div className="relative flex-1">
                    <input
                        ref={addInputRef}
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={handleAddKeyDown}
                        placeholder={t.inputPlaceholder}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 placeholder-slate-400 transition-all"
                    />
                     {renderCharCount(newKeyword)}
                </div>
                <button
                    onClick={submitAddKeyword}
                    disabled={!newKeyword.trim()}
                    className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 disabled:bg-slate-300 transition-colors flex-shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </button>
                <button
                    onClick={() => { setIsAdding(false); setNewKeyword(''); }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
             </div>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-2">
            
            {/* Keywords List */}
            {keywords.map((keyword) => {
              const isExact = keyword.detected;
              const isFuzzyOnly = !isExact && (keyword.fuzzyCount || 0) > 0;
              
              // Styling logic
              const containerClass = isExact 
                  ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                  : isFuzzyOnly 
                      ? 'bg-amber-50 border-amber-200 shadow-sm'
                      : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm';
              
              const dotClass = isExact
                  ? 'bg-emerald-500'
                  : isFuzzyOnly
                      ? 'bg-amber-500'
                      : 'bg-slate-300';
              
              const textClass = isExact
                  ? 'text-emerald-900'
                  : isFuzzyOnly
                      ? 'text-amber-900'
                      : 'text-slate-700';

              return (
              <div
                key={keyword.id}
                className={`group relative flex items-center justify-between p-2 pl-3 rounded-lg border transition-all duration-300 min-h-[42px] ${containerClass}`}
              >
                {editingId === keyword.id ? (
                    // Edit Mode - Floating Overlay
                    <>
                        {/* Ghost element to maintain layout stability */}
                        <div className="invisible flex flex-col min-w-0 flex-1 mr-2 opacity-0 pointer-events-none">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-300" />
                                <span className="text-sm font-medium truncate leading-tight">
                                    {keyword.text}
                                </span>
                            </div>
                        </div>

                        {/* Floating Edit Card */}
                        <div className="absolute top-[-4px] left-[-4px] z-50 min-w-[calc(100%+8px)] w-auto bg-white shadow-xl rounded-xl border border-indigo-200 p-2 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200 origin-top-left ring-2 ring-indigo-500/10">
                            <div className="relative flex-1 min-w-[160px]">
                                <input 
                                    ref={editInputRef}
                                    type="text" 
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={handleEditKeyDown}
                                    className="w-full px-2 py-1.5 pr-10 text-xs bg-slate-50 border border-indigo-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-medium"
                                />
                                {renderCharCount(editText)}
                            </div>
                            <button onClick={saveEdit} className="p-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex-shrink-0 shadow-sm" aria-label={t.saveAria}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg flex-shrink-0" aria-label={t.cancelAria}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </>
                ) : (
                    // View Mode
                    <>
                        <div className="flex flex-col min-w-0 flex-1 mr-2">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
                                <span className={`text-sm font-medium truncate leading-tight ${textClass}`} title={keyword.text}>
                                    {keyword.text}
                                </span>
                            </div>
                            {/* Stats for this keyword */}
                            {hasAnalyzed && (keyword.matchCount! > 0 || keyword.fuzzyCount! > 0) && (
                               <div className="flex gap-2 text-[9px] pl-3 mt-0.5 opacity-80 leading-none">
                                  {keyword.matchCount! > 0 && <span className="text-emerald-700 font-semibold">{keyword.matchCount}</span>}
                                  {keyword.fuzzyCount! > 0 && <span className="text-amber-600 font-semibold">~{keyword.fuzzyCount}</span>}
                               </div>
                            )}
                        </div>

                        {/* Actions (Absolute positioned or flex end) */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-[1px] absolute right-1 rounded-md shadow-sm border border-slate-100 p-0.5 z-10">
                            <button
                                onClick={() => startEditing(keyword)}
                                disabled={isProcessing}
                                className="text-slate-400 hover:text-indigo-600 p-1 transition-colors hover:bg-slate-100 rounded"
                                aria-label={t.editAria}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                            <button
                                onClick={() => removeKeyword(keyword.id)}
                                disabled={isProcessing}
                                className="text-slate-400 hover:text-red-500 p-1 transition-colors hover:bg-red-50 rounded"
                                aria-label={t.deleteAria}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </>
                )}
              </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};

export default KeywordManager;
