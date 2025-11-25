import JSZip from 'jszip';
import * as FileSaver from 'file-saver';

export const downloadArticleAsZip = async (content: string, suggestedTitle?: string) => {
  const zip = new JSZip();

  // Try to find a title from the markdown if not provided
  let title = suggestedTitle;
  if (!title) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    title = titleMatch ? titleMatch[1].trim() : 'article';
  }

  // Sanitize filename
  const folderName = title!.replace(/[<>:"/\\|?*]/g, '').substring(0, 50).trim() || 'likeyou_article';
  const folder = zip.folder(folderName);

  if (!folder) return;

  let processedContent = content;
  const imagesFolder = folder.folder('images');

  // Regex to find markdown images with base64 data: ![alt](data:image/xyz;base64,...)
  const imageRegex = /!\[(.*?)\]\((data:image\/([a-zA-Z]+);base64,([^)]+))\)/g;
  
  const matches = [...content.matchAll(imageRegex)];
  
  if (matches.length > 0 && imagesFolder) {
    matches.forEach((match, index) => {
      const fullTag = match[0];
      const altText = match[1] || `image_${index + 1}`;
      const mimeSubtype = match[3]; // jpeg, png, etc.
      const base64Data = match[4];
      
      const extension = mimeSubtype === 'jpeg' ? 'jpg' : mimeSubtype;
      const filename = `img_${index + 1}_${index + Date.now().toString().slice(-4)}.${extension}`;
      
      // Add image to zip
      imagesFolder.file(filename, base64Data, { base64: true });

      // Replace Base64 tag with relative path in Markdown
      // Note: We use global replace for specific strings to ensure correct replacement
      processedContent = processedContent.replace(fullTag, `![${altText}](images/${filename})`);
    });
  }

  // Add the markdown file
  folder.file(`${folderName}.md`, processedContent);

  // Generate and download
  try {
    const blob = await zip.generateAsync({ type: 'blob' });
    
    // Handle FileSaver import compatibility
    // 'FileSaver' might be the module object containing 'saveAs', or the function itself depending on the build
    const saveAs = (FileSaver as any).saveAs || (FileSaver as any).default?.saveAs || (FileSaver as any).default || FileSaver;
    
    if (typeof saveAs === 'function') {
      saveAs(blob, `${folderName}.zip`);
    } else {
      console.error("FileSaver saveAs is not a function", saveAs);
      alert("下載功能暫時無法使用 (Library Error)");
    }
  } catch (error) {
    console.error("Failed to generate zip file", error);
    alert("打包下載失敗，請稍後再試。");
  }
};