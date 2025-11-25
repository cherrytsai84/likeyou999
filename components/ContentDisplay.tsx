import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Trash2, Image as ImageIcon, Download } from 'lucide-react';
import { downloadArticleAsZip } from '../services/downloadService';

interface ContentDisplayProps {
  content: string;
  onClear: () => void;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, onClear }) => {
  const [copied, setCopied] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  if (!content) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadArticleAsZip(content);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col h-full min-h-[500px]">
      <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex justify-between items-center sticky top-0 z-10 flex-wrap gap-2">
        <h3 className="font-bold text-stone-700 font-serif flex items-center gap-2">
          生成結果
          <span className="text-xs font-sans font-normal bg-stone-200 px-2 py-0.5 rounded text-stone-600 hidden sm:inline-block">Markdown 預覽</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-[#395A77] bg-white border border-[#395A77]/30 hover:bg-[#395A77] hover:text-white transition-all shadow-sm"
            title="下載文章內容與圖片 (ZIP)"
          >
            <Download size={16} />
            {isDownloading ? '打包中...' : '下載文章與圖片'}
          </button>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-stone-200 hover:bg-stone-50 text-stone-600'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '已複製' : '複製文字'}
          </button>
          
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-white">
        <div className="prose prose-stone prose-lg max-w-none 
          prose-headings:font-serif 
          
          /* H1 Styling: Official Website Style - Centered, Clean, Brand Color */
          prose-h1:text-3xl md:prose-h1:text-4xl prose-h1:font-bold prose-h1:text-[#395A77] 
          prose-h1:text-center prose-h1:leading-tight
          prose-h1:pb-8 prose-h1:mb-12 prose-h1:border-b prose-h1:border-stone-200
          prose-h1:mt-4

          /* H2 Styling: Section Headers with Brand Accent */
          prose-h2:text-2xl prose-h2:font-bold prose-h2:text-[#395A77] 
          prose-h2:mt-12 prose-h2:mb-6
          prose-h2:pl-4 prose-h2:border-l-[6px] prose-h2:border-[#395A77]
          
          /* H3 Styling: Subsections */
          prose-h3:text-xl prose-h3:font-semibold prose-h3:text-[#537a9e] prose-h3:mt-8 prose-h3:mb-4

          /* Paragraph & Text Styling - Relaxed reading experience */
          prose-p:text-stone-600 prose-p:leading-loose prose-p:mb-6 prose-p:tracking-wide
          prose-strong:text-[#395A77] prose-strong:font-bold
          prose-li:marker:text-[#395A77] prose-li:text-stone-600
          
          /* Blockquotes - for 'Tips' or highlights */
          prose-blockquote:border-l-4 prose-blockquote:border-[#395A77]/30
          prose-blockquote:bg-[#395A77]/5 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg
          prose-blockquote:text-[#395A77] prose-blockquote:not-italic prose-blockquote:font-medium

          /* Image Styling - Full width container style */
          prose-img:rounded-sm prose-img:shadow-sm prose-img:my-10 prose-img:w-full
        ">
          <ReactMarkdown
            urlTransform={(url) => url}
            components={{
              // Custom renderer for images
              img: ({node, ...props}) => (
                <figure className="my-10">
                  <img 
                    {...props} 
                    className="w-full rounded-lg shadow-md object-cover max-h-[500px]" 
                    loading="lazy"
                  />
                  {props.alt && (
                    <figcaption className="text-center text-sm text-stone-500 mt-3 font-light tracking-wider flex justify-center items-center gap-2">
                       <ImageIcon size={12} className="opacity-50"/> {props.alt}
                    </figcaption>
                  )}
                </figure>
              )
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ContentDisplay;