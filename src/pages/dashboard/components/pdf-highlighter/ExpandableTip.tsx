import React, { useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import CommentForm from './CommentForm';
import {
  GhostHighlight,
  PdfSelection,
  usePdfHighlighterContext
} from 'react-pdf-highlighter-extended';

interface ExpandableTipProps {
  addHighlight: (highlight: GhostHighlight, comment: string) => void;
}

const ExpandableTip = ({ addHighlight }: ExpandableTipProps) => {
  const [compact, setCompact] = useState(true);
  const selectionRef = useRef<PdfSelection | null>(null);

  const {
    getCurrentSelection,
    removeGhostHighlight,
    setTip,
    updateTipPosition
  } = usePdfHighlighterContext();

  useLayoutEffect(() => {
    if (updateTipPosition) {
      updateTipPosition();
    }
  }, [compact, updateTipPosition]);

  return (
    <div className="z-10">
      {compact ? (
        <Button
          size="sm"
          onClick={() => {
            setCompact(false);
            selectionRef.current = getCurrentSelection();
            selectionRef.current!.makeGhostHighlight();
          }}
        >
          Add highlight
        </Button>
      ) : (
        <CommentForm
          placeHolder="Your comment..."
          onSubmit={(input) => {
            if (selectionRef.current) {
              addHighlight(
                {
                  content: selectionRef.current.content,
                  type: selectionRef.current.type,
                  position: selectionRef.current.position
                },
                input
              );
              removeGhostHighlight();
              setTip(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default ExpandableTip;
