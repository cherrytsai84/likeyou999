import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import GeneratorForm from './components/GeneratorForm';
import ContentDisplay from './components/ContentDisplay';
import { AppMode, GeneratorInputs, ArticleCategory } from './types';
import { generateContent, generateImage, getTrendingTopics } from './services/geminiService';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.HUB_PAGE);
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    setTrendSuggestions([]); // Clear trends when switching
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

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedResult(''); 

    try {
      // 1. Generate Text Content
      const textResult = await generateContent(activeMode, inputs);
      let finalContent = textResult;

      // 2. Automatically generate image if it's a single article or trend article
      if (activeMode === AppMode.ARTICLE || activeMode === AppMode.TREND_ARTICLE) {
        const topicForImage = activeMode === AppMode.ARTICLE ? inputs.topic : inputs.trendTopic;
        
        if (topicForImage) {
           // We do this in parallel to the text generation usually, but here we do sequential for simplicity 
           // or we could assume the text generation took a while so the user is waiting.
           // Let's create a visual separator in the loading if needed, but for now just wait.
           try {
             const base64Image = await generateImage(topicForImage);
             if (base64Image) {
               // Prepend the image to the markdown
               finalContent = `![${topicForImage} 示意圖](${base64Image})\n\n${textResult}`;
             }
           } catch (imgErr) {
             console.warn("Image generation failed silently", imgErr);
             // Don't fail the whole process if image fails, just show text
           }
        }
      }

      setGeneratedResult(finalContent);
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
        
        {/* Left Column: Input Panel */}
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
              系統現在會自動為您的文章生成首圖（使用 Gemini Nano Banana 模型）。
            </p>
            <p className="opacity-90 leading-relaxed">
              所有的內容產出都已自動套用「璽歡」品牌風格與法規濾鏡。
            </p>
          </div>
        </div>

        {/* Right Column: Output Panel */}
        <div className="w-full lg:w-2/3 h-full min-h-[calc(100vh-8rem)]">
          {error && (
             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-3">
               <AlertCircle size={20} className="mt-0.5 shrink-0" />
               <div>
                 <p className="font-medium">Generation Failed</p>
                 <p className="text-sm opacity-90">{error}</p>
               </div>
             </div>
          )}
          
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
                請在左側選擇模式並輸入參數，AI 將為您撰寫符合品牌規範的文案並自動配圖。
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default App;