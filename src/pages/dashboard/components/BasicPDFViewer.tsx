import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Search, Upload, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Use the Document and Page components from react-pdf
import { Document, Page, pdfjs } from 'react-pdf';
// Set the worker source for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PRIMARY_PDF_URL = 'https://arxiv.org/pdf/2203.11115';
const SECONDARY_PDF_URL = 'https://arxiv.org/pdf/1604.02480';

const BasicPDFViewer = () => {
  const [url, setUrl] = useState<string>(PRIMARY_PDF_URL);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [scale, setScale] = useState(1.0);

  // Load custom PDF
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
      setUrl(customUrl);
      setPageNumber(1);
    } catch (err) {
      setError('Invalid URL. Please enter a valid PDF URL');
    } finally {
      setLoading(false);
    }
  };

  // Handle document load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
  };

  // Handle document load error
  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please check the URL and try again.');
    setLoading(false);
  };

  // Change page
  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset;
      return newPageNumber >= 1 && newPageNumber <= (numPages || 1)
        ? newPageNumber
        : prevPageNumber;
    });
  };

  // Handle zoom
  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 2.0));
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));
  };

  return (
    <div className="grid gap-4">
      {/* Controls Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Basic PDF Viewer</CardTitle>
          <CardDescription>View PDF documents from URLs</CardDescription>
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
                  Choose from our sample PDF documents
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUrl(PRIMARY_PDF_URL);
                      setPageNumber(1);
                    }}
                    className={`${url === PRIMARY_PDF_URL ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                  >
                    TypeScript vs JavaScript Study
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUrl(SECONDARY_PDF_URL);
                      setPageNumber(1);
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
      </Card>

      {/* PDF Viewer */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm">{Math.round(scale * 100)}%</span>
              <Button variant="outline" size="icon" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => changePage(-1)}
                disabled={pageNumber <= 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {pageNumber} of {numPages || '?'}
              </span>
              <Button
                variant="outline"
                onClick={() => changePage(1)}
                disabled={pageNumber >= (numPages || 1)}
              >
                Next
              </Button>
            </div>
          </div>

          <div className="flex min-h-[800px] justify-center rounded-md border bg-muted/20 p-2">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicPDFViewer;
