import React from 'react';
import { AppMode } from '../types';
import { MODE_CONFIG } from '../constants';
import { LayoutDashboard, ListTodo, FileText, TrendingUp, Sparkles } from 'lucide-react';

interface SidebarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentMode, onModeChange }) => {
  
  const getIcon = (mode: AppMode) => {
    switch (mode) {
      case AppMode.HUB_PAGE: return <LayoutDashboard size={20} />;
      case AppMode.ARTICLE_PLAN: return <ListTodo size={20} />;
      case AppMode.ARTICLE: return <FileText size={20} />;
      case AppMode.TREND_ARTICLE: return <TrendingUp size={20} />;
      default: return <Sparkles size={20} />;
    }
  };

  return (
    <div className="w-64 bg-stone-900 text-stone-300 h-screen flex flex-col shadow-xl fixed left-0 top-0 border-r border-stone-800">
      <div className="p-6 border-b border-stone-800">
        <div className="flex items-center gap-3 text-emerald-400">
          <Sparkles size={24} />
          <h1 className="text-xl font-bold tracking-wider text-white">LikeYou Editor</h1>
        </div>
        <p className="text-xs mt-2 text-stone-500">AI Content Strategy & Gen</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {Object.values(AppMode).map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              currentMode === mode
                ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-100'
            }`}
          >
            {getIcon(mode)}
            <span>{MODE_CONFIG[mode].label.split('(')[0]}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-stone-800 text-xs text-stone-600 text-center">
        Powered by Gemini 2.5 Flash
      </div>
    </div>
  );
};

export default Sidebar;
