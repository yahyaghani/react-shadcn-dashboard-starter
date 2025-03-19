import React, { MouseEvent, useEffect, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Search, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  GhostHighlight,
  PdfHighlighter,
  PdfHighlighterUtils,
  PdfLoader
} from 'react-pdf-highlighter-extended';

import HighlightContainer from './pdf-highlighter/HighlightContainer';
import ExpandableTip from './pdf-highlighter/ExpandableTip';
import Sidebar from './pdf-highlighter/Sidebar';
import Toolbar from './pdf-highlighter/Toolbar';
import ContextMenu, { ContextMenuProps } from './pdf-highlighter/ContextMenu';
import { CommentedHighlight } from '../types/pdf-viewer-types';
import { testHighlights } from './pdf-highlighter/test-highlights';

const PRIMARY_PDF_URL = 'https://arxiv.org/pdf/2203.11115';
const SECONDARY_PDF_URL = 'https://arxiv.org/pdf/1604.02480';

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () => {
  return document.location.hash.slice('#highlight-'.length);
};

const resetHash = () => {
  document.location.hash = '';
};

const PDFViewer = () => {
  const [url, setUrl] = useState<string>(PRIMARY_PDF_URL);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('document.pdf');
  const [loading, setLoading] = useState<boolean>(false);
  const [highlights, setHighlights] = useState<Array<CommentedHighlight>>(
    testHighlights[PRIMARY_PDF_URL] ?? []
  );
  const [pdfScaleValue, setPdfScaleValue] = useState<number | undefined>(
    undefined
  );
  const [highlightPen, setHighlightPen] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuProps | null>(null);
  const currentPdfIndexRef = useRef(0);

  // Refs for PdfHighlighter utilities
  const highlighterUtilsRef = useRef<PdfHighlighterUtils>();

  // Click listeners for context menu
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [contextMenu]);

  // Handle PDF toggle between samples
  const toggleDocument = () => {
    const urls = [PRIMARY_PDF_URL, SECONDARY_PDF_URL];
    currentPdfIndexRef.current = (currentPdfIndexRef.current + 1) % urls.length;
    const newUrl = urls[currentPdfIndexRef.current];
    setUrl(newUrl);
    setHighlights(testHighlights[newUrl] ?? []);

    // Extract filename from URL
    const pathParts = newUrl.split('/');
    const fileName = pathParts[pathParts.length - 1];
    setFilename(fileName ? fileName + '.pdf' : 'document.pdf');
  };

  // Load custom PDF URL
  const loadCustomPdf = () => {
    if (!customUrl) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Basic URL validation
      new URL(customUrl);

      // Extract filename from URL
      const pathParts = customUrl.split('/');
      const fileName = pathParts[pathParts.length - 1];
      setFilename(fileName ? fileName + '.pdf' : 'document.pdf');

      setUrl(customUrl);
      setHighlights([]);

      // Reset current index ref to avoid confusion when toggling
      currentPdfIndexRef.current = -1;
    } catch (err) {
      setError('Invalid URL. Please enter a valid PDF URL');
    } finally {
      setLoading(false);
    }
  };

  // Handle context menu for highlights
  const handleContextMenu = (
    event: MouseEvent<HTMLDivElement>,
    highlight: any
  ) => {
    event.preventDefault();

    setContextMenu({
      xPos: event.clientX,
      yPos: event.clientY,
      deleteHighlight: () => deleteHighlight(highlight),
      editComment: () => editComment(highlight)
    });
  };

  // Add new highlight
  const addHighlight = (highlight: GhostHighlight, comment: string) => {
    setHighlights([
      {
        ...highlight,
        comment,
        id: getNextId()
      },
      ...highlights
    ]);
  };

  // Delete highlight
  const deleteHighlight = (highlight: any) => {
    setHighlights(highlights.filter((h) => h.id !== highlight.id));
  };

  // Edit highlight
  const editHighlight = (
    idToUpdate: string,
    edit: Partial<CommentedHighlight>
  ) => {
    setHighlights(
      highlights.map((highlight) =>
        highlight.id === idToUpdate ? { ...highlight, ...edit } : highlight
      )
    );
  };

  // Reset highlights
  const resetHighlights = () => {
    setHighlights([]);
  };

  // Find highlight by ID
  const getHighlightById = (id: string) => {
    return highlights.find((highlight) => highlight.id === id);
  };

  // Open comment tip and update highlight with new user input
  const editComment = (highlight: any) => {
    if (!highlighterUtilsRef.current) return;

    const editCommentTip = {
      position: highlight.position,
      content: (
        <ExpandableTip
          addHighlight={(ghostHighlight, comment) => {
            editHighlight(highlight.id, { comment });
            highlighterUtilsRef.current!.setTip(null);
            highlighterUtilsRef.current!.toggleEditInProgress(false);
          }}
        />
      )
    };

    highlighterUtilsRef.current.setTip(editCommentTip);
    highlighterUtilsRef.current.toggleEditInProgress(true);
  };

  // Scroll to highlight based on hash in URL
  const scrollToHighlightFromHash = () => {
    const highlight = getHighlightById(parseIdFromHash());

    if (highlight && highlighterUtilsRef.current) {
      highlighterUtilsRef.current.scrollToHighlight(highlight);
    }
  };

  // Set up hash change listener
  useEffect(() => {
    window.addEventListener('hashchange', scrollToHighlightFromHash);

    return () => {
      window.removeEventListener('hashchange', scrollToHighlightFromHash);
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-12">
      {/* Sample PDFs and Upload Section */}
      <Card className="col-span-12">
        <CardHeader className="pb-3">
          <CardTitle>PDF Viewer & Highlighter</CardTitle>
          <CardDescription>
            View, annotate, and highlight PDF documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="samples" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="samples">Sample PDFs</TabsTrigger>
              <TabsTrigger value="url">Custom URL</TabsTrigger>
            </TabsList>
            <TabsContent value="samples" className="mt-4">
              <div className="flex flex-col space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose from our sample PDF documents to try the highlighter
                  tool
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      currentPdfIndexRef.current = 0;
                      setUrl(PRIMARY_PDF_URL);
                      setHighlights(testHighlights[PRIMARY_PDF_URL] ?? []);
                      setFilename('typescript-vs-js-study.pdf');
                    }}
                    className={`${url === PRIMARY_PDF_URL ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                  >
                    TypeScript vs JavaScript Study
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      currentPdfIndexRef.current = 1;
                      setUrl(SECONDARY_PDF_URL);
                      setHighlights(testHighlights[SECONDARY_PDF_URL] ?? []);
                      setFilename('static-analysis-paper.pdf');
                    }}
                    className={`${url === SECONDARY_PDF_URL ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                  >
                    Static Analysis Paper
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="url" className="mt-4">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="pdf-url">Enter PDF URL</Label>
                  <div className="flex w-full max-w-lg items-center space-x-2">
                    <Input
                      id="pdf-url"
                      placeholder="https://example.com/document.pdf"
                      value={customUrl}
                      onChange={(e) => {
                        setCustomUrl(e.target.value);
                        setError(null);
                      }}
                    />
                    <Button
                      onClick={loadCustomPdf}
                      disabled={loading || !customUrl}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Load PDF
                        </>
                      )}
                    </Button>
                  </div>
                  {error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Note: The URL must point directly to a PDF file and be
                  accessible without authentication
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <Separator />
        <CardFooter className="flex justify-between pb-1 pt-4">
          <p className="text-sm text-muted-foreground">
            Current PDF: {filename}
          </p>
          <p className="text-sm text-muted-foreground">
            Highlights: {highlights.length}
          </p>
        </CardFooter>
      </Card>

      {/* PDF Viewer Section */}
      <div className="relative col-span-12 h-[800px] md:col-span-9">
        <div className="flex h-full flex-col overflow-hidden rounded-md border bg-background">
          <Toolbar
            setPdfScaleValue={setPdfScaleValue}
            toggleHighlightPen={() => setHighlightPen(!highlightPen)}
            isHighlightPenActive={highlightPen}
            filename={filename}
            url={url}
          />
          <div className="relative flex-grow overflow-hidden">
            <PdfLoader document={url}>
              {(pdfDocument) => (
                <PdfHighlighter
                  enableAreaSelection={(event) => event.altKey}
                  pdfDocument={pdfDocument}
                  onScrollAway={resetHash}
                  utilsRef={(_pdfHighlighterUtils) => {
                    highlighterUtilsRef.current = _pdfHighlighterUtils;
                  }}
                  pdfScaleValue={pdfScaleValue}
                  textSelectionColor={
                    highlightPen ? 'rgba(255, 226, 143, 1)' : undefined
                  }
                  onSelection={
                    highlightPen
                      ? (selection) =>
                          addHighlight(selection.makeGhostHighlight(), '')
                      : undefined
                  }
                  selectionTip={
                    highlightPen ? undefined : (
                      <ExpandableTip addHighlight={addHighlight} />
                    )
                  }
                  highlights={highlights}
                  className="h-full w-full"
                >
                  <HighlightContainer
                    editHighlight={editHighlight}
                    onContextMenu={handleContextMenu}
                  />
                </PdfHighlighter>
              )}
            </PdfLoader>
            {contextMenu && <ContextMenu {...contextMenu} />}
          </div>
        </div>
      </div>

      {/* Highlights Sidebar */}
      <div className="col-span-12 h-[800px] md:col-span-3">
        <Sidebar
          highlights={highlights}
          resetHighlights={resetHighlights}
          toggleDocument={toggleDocument}
          currentFilename={filename}
        />
      </div>
    </div>
  );
};

export default PDFViewer;
