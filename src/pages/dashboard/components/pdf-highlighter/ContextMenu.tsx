import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';

export interface ContextMenuProps {
  xPos: number;
  yPos: number;
  editComment: () => void;
  deleteHighlight: () => void;
}

const ContextMenu = ({
  xPos,
  yPos,
  editComment,
  deleteHighlight
}: ContextMenuProps) => {
  return (
    <Card
      className="absolute z-50 shadow-md"
      style={{
        top: yPos + 2,
        left: xPos + 2,
        minWidth: '150px'
      }}
    >
      <CardContent className="p-1">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex justify-start"
            onClick={editComment}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Comment
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={deleteHighlight}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContextMenu;
