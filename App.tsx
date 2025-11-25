import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import GeneratorForm from './components/GeneratorForm';
import ContentDisplay from './components/ContentDisplay';
import LibraryView from './components/LibraryView';
import { AppMode, GeneratorInputs, ArticleCategory, ArticleHistoryItem } from './types';
import { generateContent, getTrendingTopics } from './services/geminiService';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.HUB_PAGE);
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Article History / Library
  const [history, setHistory] = useState<ArticleHistoryItem[]>([]);

  // Trend Features
  const [isSearchingTrends, setIsSearchingTrends] = useState<boolean>(false);
  const [trendSuggestions, setTrendSuggestions] = useState<string[]>([]);

  const [inputs, setInputs] = useState<GeneratorInputs>({
    category: ArticleCategory.DAILY_WELLBEING,
    topic: '',
    wordCount: '800-1000',
    quantity: 10,
    trendTopic: ''
  });

  const handleModeChange = (mode: AppMode) => {
    setActiveMode(mode);
    setError(null);
    setTrendSuggestions([]); 
    
    // Clear display if switching to library, otherwise keep content if switching between gen modes
    if (mode === AppMode.LIBRARY) {
      setGeneratedResult('');
    }
  };

  const handleSearchTrends = async () => {
    setIsSearchingTrends(true);
    setError(null);
    try {
      const trends = await getTrendingTopics();
      setTrendSuggestions(trends);
    } catch (err: any) {
      console.error("Failed to fetch trends", err);
      setError("無法取得熱門話題，請稍後再試。");
    } finally {
      setIsSearchingTrends(false);
    }
  };

  const addToHistory = (content: string, inputs: GeneratorInputs, mode: AppMode) => {
    // Attempt to extract a title from Markdown (# Title)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : (inputs.topic || inputs.trendTopic || '未命名文章');
    
    // Determine category based on mode or input
    let category = '';
    if (mode === AppMode.TREND_ARTICLE) category = '時事生活・Trend Notes';
    else if (mode === AppMode.ARTICLE) category = inputs.category;
    else category = '其他';

    const newItem: ArticleHistoryItem = {
      id: Date.now().toString(),
      title,
      category,
      content,
      timestamp: Date.now()
    };

    setHistory(prev => [newItem, ...prev]);
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleSelectHistory = (item: ArticleHistoryItem) => {
    setGeneratedResult(item.content);
    // Switch to view mode if needed, but for now we reuse ContentDisplay area
    // Just ensure we aren't in Library mode anymore so we see the content
    // Or we could have a "Preview" in library. Let's keep it simple: 
    // click item -> load content -> stay in Library mode visually but show content?
    // Actually, let's switch to ARTICLE mode to "Edit/View" it or just show it.
    // Let's keep Sidebar on Library but show ContentDisplay.
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedResult(''); 

    try {
      // Pass history to generateContent for "Read More" context
      const finalContent = await generateContent(activeMode, inputs, history);
      setGeneratedResult(finalContent);

      // Automatically save to Library if it's a generated article
      if (activeMode === AppMode.ARTICLE || activeMode === AppMode.TREND_ARTICLE) {
        addToHistory(finalContent, inputs, activeMode);
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setGeneratedResult('');
    setError(null);
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Navigation */}
      <Sidebar currentMode={activeMode} onModeChange={handleModeChange} />

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8 md:p-12 lg:p-16 w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Input Panel (Hidden in Library Mode) */}
        {activeMode !== AppMode.LIBRARY && (
          <div className="w-full lg:w-1/3 flex flex-col shrink-0">
            <GeneratorForm
              mode={activeMode}
              inputs={inputs}
              setInputs={setInputs}
              onSubmit={handleGenerate}
              isLoading={isLoading}
              onSearchTrends={handleSearchTrends}
              isSearchingTrends={isSearchingTrends}
              trendSuggestions={trendSuggestions}
            />
            
            {/* Quick Tip / Status */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-sm text-emerald-800">
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <span className="bg-emerald-200 text-emerald-800 text-xs px-1.5 py-0.5 rounded">Tips</span>
                編輯小提醒
              </h4>
              <p className="opacity-90 leading-relaxed mb-2">
                系統現在會自動為您的文章生成 3~5 張圖片（含封面）。
              </p>
              <p className="opacity-90 leading-relaxed mb-2">
                人物設定已更新為「台灣/東亞面孔」。分析類內容將自動產生圖表。
              </p>
              <p className="opacity-90 leading-relaxed">
                SEO 區塊已移至文章最底部，並自動加入延伸閱讀連結。
              </p>
            </div>
          </div>
        )}

        {/* Right Column: Output Panel or Library View */}
        <div className={`w-full ${activeMode === AppMode.LIBRARY ? 'lg:w-full' : 'lg:w-2/3'} h-full min-h-[calc(100vh-8rem)]`}>
          
          {error && (
             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-3">
               <AlertCircle size={20} className="mt-0.5 shrink-0" />
               <div>
                 <p className="font-medium">Generation Failed</p>
                 <p className="text-sm opacity-90">{error}</p>
               </div>
             </div>
          )}
          
          {activeMode === AppMode.LIBRARY ? (
            // If result is selected, show content, else show list
            generatedResult ? (
              <div>
                <button 
                  onClick={() => setGeneratedResult('')}
                  className="mb-4 text-emerald-600 hover:underline flex items-center gap-1"
                >
                  ← 返回列表
                </button>
                <ContentDisplay content={generatedResult} onClear={() => setGeneratedResult('')} />
              </div>
            ) : (
              <LibraryView 
                history={history} 
                onSelect={handleSelectHistory} 
                onDelete={handleDeleteHistory} 
              />
            )
          ) : (
            <>
              <ContentDisplay 
                content={generatedResult} 
                onClear={handleClear} 
              />

              {!generatedResult && !isLoading && !error && (
                <div className="h-full border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-stone-400 p-12 text-center">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="opacity-20" size={32} />
                  </div>
                  <p className="font-medium text-lg">尚未生成內容</p>
                  <p className="text-sm mt-2 max-w-xs">
                    請在左側選擇模式並輸入參數，AI 將為您撰寫符合品牌規範的文案並自動在文中插入配圖。
                  </p>
                </div>
              )}
            </>
          )}
        </div>

      </main>
    </div>
  );
};

export default App;
