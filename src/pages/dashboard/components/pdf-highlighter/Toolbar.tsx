import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Highlighter, DownloadCloud } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  setPdfScaleValue: (value: number) => void;
  toggleHighlightPen: () => void;
  filename?: string;
  url?: string;
  isHighlightPenActive: boolean;
}

const Toolbar = ({
  setPdfScaleValue,
  toggleHighlightPen,
  filename,
  url,
  isHighlightPenActive
}: ToolbarProps) => {
  const [zoom, setZoom] = useState<number | null>(null);

  const zoomIn = () => {
    if (zoom) {
      if (zoom < 4) {
        const newZoom = zoom + 0.1;
        setPdfScaleValue(newZoom);
        setZoom(newZoom);
      }
    } else {
      setPdfScaleValue(1.1);
      setZoom(1.1);
    }
  };

  const zoomOut = () => {
    if (zoom) {
      if (zoom > 0.2) {
        const newZoom = zoom - 0.1;
        setPdfScaleValue(newZoom);
        setZoom(newZoom);
      }
    } else {
      setPdfScaleValue(0.9);
      setZoom(0.9);
    }
  };

  const handleDownload = () => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex items-center gap-2 border-b bg-background p-2">
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={zoomIn}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={zoomOut}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>

          <span className="mx-1 min-w-16 text-center text-sm">
            {zoom ? `${(zoom * 100).toFixed(0)}%` : 'Auto'}
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isHighlightPenActive ? 'default' : 'outline'}
              size="icon"
              onClick={toggleHighlightPen}
              aria-label="Toggle highlight pen"
              className={cn(
                isHighlightPenActive &&
                  'border-yellow-500 bg-yellow-500 text-background hover:bg-yellow-600'
              )}
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isHighlightPenActive
              ? 'Disable highlight pen'
              : 'Enable highlight pen'}
          </TooltipContent>
        </Tooltip>

        {url && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                aria-label="Download PDF"
              >
                <DownloadCloud className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download PDF</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};

export default Toolbar;
