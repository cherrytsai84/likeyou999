import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Trash2, Image as ImageIcon } from 'lucide-react';

interface ContentDisplayProps {
  content: string;
  onClear: () => void;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, onClear }) => {
  const [copied, setCopied] = React.useState(false);

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col h-full min-h-[500px]">
      <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex justify-between items-center sticky top-0 z-10">
        <h3 className="font-bold text-stone-700 font-serif flex items-center gap-2">
          生成結果
          <span className="text-xs font-sans font-normal bg-stone-200 px-2 py-0.5 rounded text-stone-600">Markdown 預覽</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              copied
                ? 'bg-emerald-100 text-emerald-700'
                : 'hover:bg-stone-200 text-stone-600'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '已複製' : '複製內容'}
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
            清除
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-8 overflow-y-auto bg-white">
        <div className="prose prose-stone prose-lg max-w-none 
          prose-headings:font-serif prose-headings:text-stone-800 
          
          /* H1 Styling for clear distinction */
          prose-h1:text-3xl prose-h1:font-bold prose-h1:text-emerald-900 
          prose-h1:pb-4 prose-h1:mb-6 prose-h1:border-b-2 prose-h1:border-emerald-100 
          prose-h1:bg-gradient-to-r prose-h1:from-emerald-50/50 prose-h1:to-transparent prose-h1:px-4 prose-h1:py-2 prose-h1:-mx-4 prose-h1:rounded-md

          /* H2 Styling */
          prose-h2:text-xl prose-h2:font-semibold prose-h2:text-emerald-800 prose-h2:mt-10 prose-h2:mb-4
          prose-h2:flex prose-h2:items-center prose-h2:before:content-[''] prose-h2:before:w-1.5 prose-h2:before:h-6 prose-h2:before:bg-emerald-400 prose-h2:before:mr-3 prose-h2:before:rounded-full

          /* Paragraph & List Styling */
          prose-p:text-stone-600 prose-p:leading-relaxed prose-li:text-stone-600 prose-strong:text-emerald-700 prose-strong:font-medium
          
          /* Image Styling */
          prose-img:rounded-xl prose-img:shadow-md prose-img:border prose-img:border-stone-100 prose-img:my-6
        ">
          <ReactMarkdown
            components={{
              // Custom renderer for images to handle the generated base64 nicely
              img: ({node, ...props}) => (
                <div className="my-6">
                  <img {...props} className="rounded-xl shadow-md border border-stone-100 w-full max-h-[400px] object-cover" />
                  {props.alt && (
                    <p className="text-center text-sm text-stone-500 mt-2 italic flex justify-center items-center gap-2">
                       <ImageIcon size={14}/> {props.alt}
                    </p>
                  )}
                </div>
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