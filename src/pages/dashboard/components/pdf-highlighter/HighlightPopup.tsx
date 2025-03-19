import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ViewportHighlight } from 'react-pdf-highlighter-extended';
import { CommentedHighlight } from '@/pages/dashboard/types/pdf-viewer-types';

interface HighlightPopupProps {
  highlight: ViewportHighlight<CommentedHighlight>;
}

const HighlightPopup = ({ highlight }: HighlightPopupProps) => {
  return (
    <Card className="z-10 max-w-sm shadow-lg">
      <CardContent className="p-2">
        {highlight.comment ? (
          <p className="text-sm">{highlight.comment}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">No comment</p>
        )}
      </CardContent>
    </Card>
  );
};

export default HighlightPopup;
