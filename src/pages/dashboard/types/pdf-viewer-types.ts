// Types for highlights and sections
export interface Comment {
  emoji?: string;
  text: string;
  classifier_score?: number;
}

export interface ContentItem {
  text?: string;
  image?: string;
  entities?: string[][];
}

export interface HighlightPosition {
  boundingRect: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    height: number;
    width: number;
  };
  pageNumber: number;
  rects: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    height: number;
    width: number;
  }[];
}

export interface HighlightItem {
  id: string;
  comment: Comment;
  content: ContentItem;
  position: HighlightPosition;
}

export interface Section {
  clause: string;
  text: string;
}

export interface FileHighlights {
  highlights: HighlightItem[];
  name: string;
  entities?: string[];
  sections?: Section[];
}

// Helper functions for highlights
export const getNextId = (): string => String(Math.random()).slice(2);

export const parseIdFromHash = (): string => {
  return document.location.hash.slice('#pdf-highlight-'.length);
};

export const resetHash = (): void => {
  document.location.hash = '';
};

export const updateHash = (highlight: HighlightItem): void => {
  document.location.hash = `pdf-highlight-${highlight.id}`;
};

// Process markdown helper (simplified version)
export const processMd = (text: string): string => {
  return text;
};

// Extract highlighting class based on highlight type
export const getHighlightClass = (type: string): string => {
  const typeMap: Record<string, string> = {
    ISSUE: 'bg-blue-200',
    LEGAL_TEST: 'bg-purple-200',
    CONCLUSION: 'bg-green-200',
    AXIOM: 'bg-yellow-200',
    OTHER: 'bg-gray-200'
  };

  return typeMap[type.toUpperCase()] || 'bg-gray-200';
};
