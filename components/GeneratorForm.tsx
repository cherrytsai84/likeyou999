import React from 'react';
import { AppMode, GeneratorInputs, ArticleCategory, HubPageType } from '../types';
import { CATEGORIES, MODE_CONFIG } from '../constants';
import { Wand2, Loader2, Search, TrendingUp, Sparkles } from 'lucide-react';
import { optimizeTitle } from '../services/geminiService';

interface GeneratorFormProps {
  mode: AppMode;
  inputs: GeneratorInputs;
  setInputs: React.Dispatch<React.SetStateAction<GeneratorInputs>>;
  onSubmit: () => void;
  isLoading: boolean;
  onSearchTrends: () => Promise<void>;
  isSearchingTrends: boolean;
  trendSuggestions: string[];
}

const GeneratorForm: React.FC<GeneratorFormProps> = ({
  mode,
  inputs,
  setInputs,
  onSubmit,
  isLoading,
  onSearchTrends,
  isSearchingTrends,
  trendSuggestions
}) => {
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [titleSuggestions, setTitleSuggestions] = React.useState<string[]>([]);

  const handleChange = (field: keyof GeneratorInputs, value: string | number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleTrendClick = (trend: string) => {
    setInputs(prev => ({ ...prev, trendTopic: trend }));
  };

  const isFormValid = () => {
    switch (mode) {
      case AppMode.HUB_PAGE:
        // Now requires a type selection, generic input is optional
        return !!inputs.hubPageType;
      case AppMode.ARTICLE_PLAN:
        return inputs.quantity > 0 && inputs.category;
      case AppMode.ARTICLE:
        return inputs.topic.length > 0 && inputs.category;
      case AppMode.TREND_ARTICLE:
        return inputs.trendTopic.length > 0;
      default:
        return false;
    }
  };

  const handleOptimizeTitle = async () => {
    if (!inputs.topic) return;
    setIsOptimizing(true);
    try {
      const suggestions = await optimizeTitle(inputs.topic);
      setTitleSuggestions(suggestions);
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-xl font-serif font-bold text-stone-800 mb-2">{MODE_CONFIG[mode].label}</h2>
        <p className="text-sm text-stone-500">{MODE_CONFIG[mode].description}</p>
      </div>

      <div className="space-y-5">
        
        {/* HUB PAGE: Type Selection */}
        {mode === AppMode.HUB_PAGE && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">撰寫類別</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {Object.values(HubPageType).map((type) => (
                <button
                  key={type}
                  onClick={() => handleChange('hubPageType', type)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all ${
                    inputs.hubPageType === type
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-emerald-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-stone-700 mb-2">
              補充說明或核心概念 (選填)
            </label>
            <textarea
              rows={3}
              placeholder={inputs.hubPageType === HubPageType.BRAND_STORY 
                ? "例如：希望能強調創辦人對於『陪伴』的初衷..." 
                : "例如：想探討現代人對於『獨處』的情緒需求..."}
              value={inputs.brandConcept}
              onChange={(e) => handleChange('brandConcept', e.target.value)}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        )}

        {/* Category Selection - Used in Plan and Article */}
        {(mode === AppMode.ARTICLE_PLAN || mode === AppMode.ARTICLE) && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">文章分類</label>
            <select
              value={inputs.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quantity - Article Plan */}
        {mode === AppMode.ARTICLE_PLAN && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">預計規劃篇數</label>
            <input
              type="number"
              min="1"
              max="20"
              value={inputs.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        )}

        {/* Topic - Single Article */}
        {mode === AppMode.ARTICLE && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">文章主題</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="例如：冬天喝水變少怎麼辦"
                value={inputs.topic}
                onChange={(e) => handleChange('topic', e.target.value)}
                className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
               <button
                onClick={handleOptimizeTitle}
                disabled={!inputs.topic || isOptimizing}
                className="px-3 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
                title="AI 優化標題"
              >
                {isOptimizing ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18} />}
              </button>
            </div>
            {/* Title Suggestions */}
            {titleSuggestions.length > 0 && (
              <div className="mt-3 space-y-2 animate-fadeIn">
                <p className="text-xs text-stone-500 font-medium ml-1">AI 建議標題 (點擊套用):</p>
                {titleSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleChange('topic', suggestion);
                      setTitleSuggestions([]);
                    }}
                    className="block w-full text-left px-3 py-2 bg-indigo-50/50 hover:bg-indigo-100 text-stone-700 text-sm rounded border border-indigo-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Word Count - Single Article */}
        {mode === AppMode.ARTICLE && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">目標字數</label>
            <input
              type="text"
              value={inputs.wordCount}
              onChange={(e) => handleChange('wordCount', e.target.value)}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        )}

        {/* Trend Topic - Trend Article */}
        {mode === AppMode.TREND_ARTICLE && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">近期時事／話題</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="例如：政府普發一萬元、寒流來襲"
                value={inputs.trendTopic}
                onChange={(e) => handleChange('trendTopic', e.target.value)}
                className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                onClick={onSearchTrends}
                disabled={isSearchingTrends}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-2 whitespace-nowrap"
                title="自動搜尋台灣近期熱門話題"
              >
                {isSearchingTrends ? <Loader2 className="animate-spin" size={18}/> : <Search size={18} />}
                <span className="text-sm font-medium hidden sm:inline">搜尋熱門</span>
              </button>
            </div>
            
            {/* Trend Suggestions Chips */}
            {trendSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 animate-fadeIn">
                {trendSuggestions.map((trend, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTrendClick(trend)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs text-stone-600 hover:border-emerald-400 hover:text-emerald-700 transition-all shadow-sm"
                  >
                    <TrendingUp size={12} />
                    {trend}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onSubmit}
          disabled={!isFormValid() || isLoading}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            !isFormValid() || isLoading
              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>AI 思考與繪圖中...</span>
            </>
          ) : (
            <>
              <Wand2 size={20} />
              <span>開始生成內容</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GeneratorForm;