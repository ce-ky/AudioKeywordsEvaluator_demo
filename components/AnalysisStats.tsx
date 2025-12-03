
import React from 'react';
import { Keyword } from '../types';
import { translations } from '../utils/translations';

interface AnalysisStatsProps {
  keywords: Keyword[];
  hasAnalyzed: boolean;
  t: typeof translations['zh']['keywordManager'];
  onReset: () => void;
  isProcessing: boolean;
}

export const AnalysisStats: React.FC<AnalysisStatsProps> = ({ keywords, hasAnalyzed, t, onReset, isProcessing }) => {
  if (!hasAnalyzed || keywords.length === 0) return null;

  const totalCount = keywords.length;
  
  // Exact Match Stats
  const detectedCount = keywords.filter(k => k.detected && (k.matchCount && k.matchCount > 0)).length;
  const hitRate = totalCount > 0 ? Math.round((detectedCount / totalCount) * 100) : 0;
  
  // Fuzzy Match Stats
  const fuzzyDetectedCount = keywords.filter(k => k.fuzzyCount && k.fuzzyCount > 0).length;
  const fuzzyRate = totalCount > 0 ? Math.round((fuzzyDetectedCount / totalCount) * 100) : 0;

  // Combined Stats (Exact OR Fuzzy)
  // Count unique keywords that have either an exact match OR a fuzzy match
  const combinedDetectedCount = keywords.filter(k => 
    (k.detected && k.matchCount && k.matchCount > 0) || 
    (k.fuzzyCount && k.fuzzyCount > 0)
  ).length;
  const combinedRate = totalCount > 0 ? Math.round((combinedDetectedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            分析概览
        </h3>
        <button
            onClick={onReset}
            disabled={isProcessing}
            className="text-xs text-slate-400 hover:text-indigo-600 font-medium transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full"
        >
            {t.reset}
        </button>
      </div>

      {/* Row 1: Exact and Fuzzy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
         {/* Exact Match Rate */}
         <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-emerald-900 flex items-center gap-1.5">
                    {t.hitRate}
                </span>
                <div className="text-right flex items-baseline gap-2">
                    <span className="text-xs text-emerald-600 font-medium">{detectedCount}/{totalCount}</span>
                    <span className="text-xl font-bold text-emerald-700">{hitRate}%</span>
                </div>
            </div>
            <div className="w-full bg-emerald-200/50 rounded-full h-2 overflow-hidden">
                <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${hitRate}%` }}
                ></div>
            </div>
         </div>

         {/* Fuzzy Match Rate */}
         <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/50">
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
                    {t.fuzzyRate}
                </span>
                <div className="text-right flex items-baseline gap-2">
                    <span className="text-xs text-amber-400 font-medium">{fuzzyDetectedCount}/{totalCount}</span>
                    <span className="text-xl font-bold text-amber-600">{fuzzyRate}%</span>
                </div>
            </div>
            <div className="w-full bg-amber-200/50 rounded-full h-2 overflow-hidden">
                <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${fuzzyRate}%` }}
                ></div>
            </div>
         </div>
      </div>

      {/* Row 2: Combined Rate */}
      <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50">
          <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-semibold text-indigo-900 flex items-center gap-1.5">
                  {t.combinedRate}
                  <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 rounded-md font-normal">Total</span>
              </span>
              <div className="text-right flex items-baseline gap-2">
                  <span className="text-xs text-indigo-600 font-medium">{combinedDetectedCount}/{totalCount}</span>
                  <span className="text-xl font-bold text-indigo-700">{combinedRate}%</span>
              </div>
          </div>
          <div className="w-full bg-indigo-200/50 rounded-full h-2.5 overflow-hidden">
              <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${combinedRate}%` }}
              ></div>
          </div>
      </div>
    </div>
  );
};
