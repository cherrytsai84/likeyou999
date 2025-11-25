import React from 'react';
import { ArticleHistoryItem } from '../types';
import { FileText, Calendar, Tag, Trash2, Download } from 'lucide-react';
import { downloadArticleAsZip } from '../services/downloadService';

interface LibraryViewProps {
  history: ArticleHistoryItem[];
  onSelect: (item: ArticleHistoryItem) => void;
  onDelete: (id: string) => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ history, onSelect, onDelete }) => {
  if (history.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-stone-400">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="opacity-20" size={32} />
        </div>
        <p className="font-medium text-lg">文章庫是空的</p>
        <p className="text-sm mt-2">請先使用「單篇知識文章」或「時事生活文」生成內容。</p>
      </div>
    );
  }

  const handleDownload = async (e: React.MouseEvent, item: ArticleHistoryItem) => {
    e.stopPropagation();
    await downloadArticleAsZip(item.content, item.title);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold text-stone-800">已生成文章庫 ({history.length})</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start group"
          >
            <div className="flex-1 cursor-pointer" onClick={() => onSelect(item)}>
              <h3 className="font-bold text-lg text-emerald-900 mb-2 group-hover:text-emerald-700 transition-colors">
                {item.title}
              </h3>
              <div className="flex items-center gap-4 text-xs text-stone-500 mb-3">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-full">
                  <Tag size={12} />
                  {item.category}
                </span>
              </div>
              <p className="text-sm text-stone-600 line-clamp-2">
                {item.content.substring(0, 150).replace(/[#*`]/g, '')}...
              </p>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <button 
                onClick={(e) => handleDownload(e, item)}
                className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="下載文章 (ZIP)"
              >
                <Download size={18} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if(window.confirm('確定要刪除這篇文章嗎？')) onDelete(item.id);
                }}
                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="刪除文章"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LibraryView;