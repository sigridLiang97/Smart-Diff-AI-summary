import React, { useRef, useEffect } from 'react';
import { DiffPart } from '../types';

interface InputHighlighterProps {
  text: string;
  onChange: (text: string) => void;
  diffParts: DiffPart[];
  type: 'original' | 'modified';
  placeholder?: string;
}

export const InputHighlighter: React.FC<InputHighlighterProps> = ({
  text,
  onChange,
  diffParts,
  type,
  placeholder
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Sync scroll position of backdrop with textarea
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    // Sync on update/mount
    handleScroll();
  }, [text]);

  const renderBackdrop = () => {
    return diffParts.map((part, index) => {
      if (type === 'original') {
        // In original view: Highlight things that were removed (i.e., exist here but not in modified)
        if (part.added) return null; // 'Added' parts don't exist in original text
        if (part.removed) {
          return (
            <span key={index} className="bg-red-100 rounded-[2px]">
              {part.value}
            </span>
          );
        }
        return <span key={index}>{part.value}</span>;
      } else {
        // In modified view: Highlight things that were added (i.e., exist here but not in original)
        if (part.removed) return null; // 'Removed' parts don't exist in modified text
        if (part.added) {
          return (
            <span key={index} className="bg-green-100 rounded-[2px]">
              {part.value}
            </span>
          );
        }
        return <span key={index}>{part.value}</span>;
      }
    });
  };

  const themeClass = type === 'original' 
    ? 'text-red-900/90 caret-red-600 placeholder:text-red-300' 
    : 'text-green-900/90 caret-green-600 placeholder:text-green-300';

  return (
    <div className="relative w-full h-full font-mono text-sm">
      {/* Backdrop Layer (Highlights) */}
      <div
        ref={backdropRef}
        className="absolute inset-0 p-4 whitespace-pre-wrap break-words pointer-events-none overflow-hidden text-transparent z-0 leading-relaxed"
        aria-hidden="true"
      >
        {renderBackdrop()}
        {/* Trailing break to ensure height matches when text ends with newline */}
        {text.endsWith('\n') && <br />}
      </div>

      {/* Foreground Layer (Input) */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        className={`absolute inset-0 w-full h-full p-4 bg-transparent border-none resize-none focus:ring-0 focus:outline-none leading-relaxed transition-colors ${themeClass}`}
        spellCheck={false}
      />
    </div>
  );
};