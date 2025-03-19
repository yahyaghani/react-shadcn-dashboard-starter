import React from 'react';
import { Comment, HighlightPosition } from '../types/pdf-viewer-types';

interface StickyNoteProps {
  isScrolledTo: boolean;
  position: HighlightPosition;
  comment: Comment;
}

// Get color based on comment type
const getBackgroundColor = (text: string): string => {
  const typeMap: Record<string, string> = {
    ISSUE: 'rgba(59, 130, 246, 0.8)', // blue
    LEGAL_TEST: 'rgba(139, 92, 246, 0.8)', // purple
    CONCLUSION: 'rgba(34, 197, 94, 0.8)', // green
    AXIOM: 'rgba(234, 179, 8, 0.8)' // yellow
  };

  return typeMap[text.toUpperCase()] || 'rgba(156, 163, 175, 0.8)'; // gray default
};

// Get text color for better contrast
const getTextColor = (text: string): string => {
  const darkBackgrounds = ['ISSUE', 'LEGAL_TEST', 'CONCLUSION'];
  return darkBackgrounds.includes(text.toUpperCase()) ? 'white' : 'black';
};

const StickyNote: React.FC<StickyNoteProps> = ({
  isScrolledTo,
  position,
  comment
}) => {
  // Calculate position (left offset of 4px)
  const style = {
    position: 'absolute' as const,
    left: '4px',
    top: `${position.boundingRect.top}px`,
    padding: '6px 10px',
    maxWidth: '200px',
    borderRadius: '4px',
    boxShadow: isScrolledTo
      ? '0 4px 8px rgba(0,0,0,0.3), 0 0 0 2px rgba(59, 130, 246, 0.5)'
      : '0 2px 4px rgba(0,0,0,0.2)',
    backgroundColor: getBackgroundColor(comment.text),
    color: getTextColor(comment.text),
    fontSize: '14px',
    fontWeight: 'bold',
    zIndex: isScrolledTo ? 2000 : 1000,
    transition: 'box-shadow 0.2s ease',
    transform: isScrolledTo ? 'scale(1.05)' : 'scale(1)'
  };

  return <div style={style}>{comment.text}</div>;
};

export default StickyNote;
