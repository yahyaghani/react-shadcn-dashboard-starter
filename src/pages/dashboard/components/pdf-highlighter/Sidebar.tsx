import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CommentedHighlight } from '@/pages/dashboard/types/pdf-viewer-types';
import { Eraser, RotateCw } from 'lucide-react';

interface SidebarProps {
  highlights: Array<CommentedHighlight>;
  resetHighlights: () => void;
  toggleDocument?: () => void;
  currentFilename?: string;
}

const updateHash = (highlight: CommentedHighlight) => {
  document.location.hash = `highlight-${highlight.id}`;
};

const Sidebar = ({
  highlights,
  resetHighlights,
  toggleDocument,
  currentFilename
}: SidebarProps) => {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-1 px-4 py-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Highlights</span>
          <span className="text-xs text-muted-foreground">
            {highlights.length > 0
              ? `${highlights.length} items`
              : 'No highlights'}
          </span>
        </CardTitle>
        {currentFilename && (
          <p className="truncate text-xs text-muted-foreground">
            {currentFilename}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex h-full flex-col p-0">
        <ScrollArea className="flex-grow">
          {highlights.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No highlights yet. Select text or use the highlight pen to
                create highlights.
              </p>
            </div>
          ) : (
            <ul className="space-y-2 p-3">
              {highlights.map((highlight, index) => (
                <li
                  key={index}
                  className="cursor-pointer rounded-md p-2 transition-colors hover:bg-muted"
                  onClick={() => {
                    updateHash(highlight);
                  }}
                >
                  <div>
                    {/* Highlight comment */}
                    {highlight.comment ? (
                      <p className="pb-1 text-sm font-medium">
                        {highlight.comment}
                      </p>
                    ) : (
                      <p className="pb-1 text-sm font-medium italic text-muted-foreground">
                        No comment
                      </p>
                    )}

                    {/* Highlight text */}
                    {highlight.content.text && (
                      <blockquote className="my-1 border-l-2 pl-2 text-xs text-muted-foreground">
                        {`${highlight.content.text.slice(0, 90).trim()}${highlight.content.text.length > 90 ? '...' : ''}`}
                      </blockquote>
                    )}

                    {/* Highlight image */}
                    {highlight.content.image && (
                      <div className="mt-1 overflow-hidden rounded-md border">
                        <img
                          src={highlight.content.image}
                          alt={'Screenshot'}
                          className="max-h-24 w-full object-contain"
                        />
                      </div>
                    )}

                    {/* Page number */}
                    <div className="pt-1 text-right text-xs text-muted-foreground">
                      Page {highlight.position.boundingRect.pageNumber}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {/* Controls */}
        <div className="flex gap-2 border-t p-3">
          {toggleDocument && (
            <Button
              size="sm"
              variant="outline"
              onClick={toggleDocument}
              className="flex-grow"
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Switch Document
            </Button>
          )}

          {highlights.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={resetHighlights}
              className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Eraser className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Sidebar;
