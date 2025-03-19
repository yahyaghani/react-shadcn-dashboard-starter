'use client';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  PdfLoader,
  PdfHighlighter,
  Highlight,
  Popup,
  AreaHighlight
} from 'react-pdf-highlighter';
import { useDropzone } from 'react-dropzone';
import DocumentAccordion from '../components/DocumentAccordion';
import {
  Comment,
  ContentItem,
  HighlightPosition,
  HighlightItem,
  FileHighlights,
  Section,
  getNextId,
  parseIdFromHash,
  resetHash,
  updateHash,
  processMd,
  getHighlightClass
} from '../types/pdf-viewer-types';

// API configuration
const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

// Highlight Popup component
const HighlightPopup: React.FC<{ comment: Comment }> = ({ comment }) => {
  return comment.text ? (
    <div className="highlight-popup rounded-md bg-white p-2 shadow-lg">
      {comment.emoji} {processMd(comment.text)}
    </div>
  ) : null;
};

// StickyNote component (simplified)
const StickyNote: React.FC<{
  isScrolledTo: boolean;
  position: HighlightPosition;
  comment: Comment;
}> = ({ isScrolledTo, position, comment }) => {
  const style = {
    position: 'absolute' as const,
    left: '4px',
    top: `${position.boundingRect.top}px`,
    background: 'yellow',
    padding: '10px',
    borderRadius: '5px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    zIndex: 1000
  };

  return <div style={style}>{comment && comment.text}</div>;
};

const PDFViewer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [highlightFilter, setHighlightFilter] = useState<string>('');
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [userPublicId, setUserPublicId] = useState<string>('user123'); // You would get this from your auth context
  const [documentSections, setDocumentSections] = useState<Section[]>([]);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [entities, setEntities] = useState<string[]>([]);

  const pdfHighlighterRef = useRef<any>(null);

  // Dropzone setup
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFileChange(acceptedFiles[0]);
      }
    }
  });

  // Handle file change
  const handleFileChange = (newFile: File) => {
    setFile(newFile);
    setPdfUrl(URL.createObjectURL(newFile));
    setHighlights([]);
    setMessage(`File "${newFile.name}" loaded. Processing...`);
    uploadFile(newFile);
  };

  // Handle file upload to server
  const uploadFile = async (fileToUpload: File) => {
    try {
      setIsLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await axios.post(
        `${API_BASE_URL}/upload/file`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
            // Add auth token if needed
            // 'x-access-token': authToken,
          }
        }
      );

      if (response.data) {
        setMessage(response.data.message || 'File uploaded successfully');

        // Fetch highlights for the uploaded file
        await fetchHighlights(fileToUpload.name);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Error uploading file');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch highlights for a file
  const fetchHighlights = async (fileName: string) => {
    try {
      const result = await axios.get(
        `${API_BASE_URL}/highlights-json/${userPublicId}/${fileName}`,
        {
          headers: {
            // Add auth token if needed
            // 'x-access-token': authToken,
          }
        }
      );

      const fileHighlights: FileHighlights = result.data;

      if (fileHighlights) {
        // Set highlights if available
        if (fileHighlights.highlights && fileHighlights.highlights.length > 0) {
          setHighlights(fileHighlights.highlights);
          setMessage(`Loaded ${fileHighlights.highlights.length} highlights`);
        } else {
          setHighlights([]);
          setMessage('No highlights found for this document');
        }

        // Set sections if available
        if (fileHighlights.sections && fileHighlights.sections.length > 0) {
          setDocumentSections(fileHighlights.sections);
        } else {
          setDocumentSections([]);
        }

        // Set entities if available
        if (fileHighlights.entities && fileHighlights.entities.length > 0) {
          setEntities(fileHighlights.entities);
        } else {
          setEntities([]);
        }
      }
    } catch (err) {
      console.error('Error fetching highlights:', err);
      setError(
        err instanceof Error ? err.message : 'Error fetching highlights'
      );
      setHighlights([]);
      setDocumentSections([]);
      setEntities([]);
    }
  };

  // Add a new highlight
  const addHighlight = (highlight: Omit<HighlightItem, 'id'>) => {
    const newHighlight = { ...highlight, id: getNextId() };
    setHighlights([newHighlight, ...highlights]);
  };

  // Update an existing highlight
  const updateHighlight = (
    highlightId: string,
    position: Partial<HighlightPosition>,
    content: Partial<ContentItem>
  ) => {
    setHighlights(
      highlights.map((h) =>
        h.id === highlightId
          ? {
              ...h,
              position: { ...h.position, ...position },
              content: { ...h.content, ...content }
            }
          : h
      )
    );
  };

  // Save highlights to the server
  const saveHighlights = async () => {
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);

      const fileHighlights: FileHighlights = {
        highlights,
        name: file.name,
        entities,
        sections: documentSections
      };

      const response = await axios.post(
        `${API_BASE_URL}/save-highlights`,
        { fileHighlights },
        {
          headers: {
            // Add auth token if needed
            // 'x-access-token': authToken,
          }
        }
      );

      if (response.data) {
        setMessage(response.data.message || 'Highlights saved successfully');
      }
    } catch (err) {
      console.error('Error saving highlights:', err);
      setError(err instanceof Error ? err.message : 'Error saving highlights');
    } finally {
      setIsLoading(false);
    }
  };

  // Get highlight by ID
  const getHighlightById = (id: string) => {
    return highlights.find((highlight) => highlight.id === id);
  };

  // Scroll to highlight from hash
  const scrollToHighlightFromHash = () => {
    const highlight = getHighlightById(parseIdFromHash());
    if (highlight && pdfHighlighterRef.current?.scrollTo) {
      pdfHighlighterRef.current.scrollTo(highlight);
    }
  };

  // Handle navigation between highlights
  const goToPreviousHighlight = () => {
    if (highlights.length === 0) return;
    const filteredHighlights = highlights.filter(
      (h) =>
        !highlightFilter ||
        h.comment.text.toUpperCase().includes(highlightFilter.toUpperCase())
    );
    if (filteredHighlights.length === 0) return;

    let prevIndex = currentHighlightIndex - 1;
    if (prevIndex < 0) prevIndex = filteredHighlights.length - 1;

    setCurrentHighlightIndex(prevIndex);
    updateHash(filteredHighlights[prevIndex]);
  };

  const goToNextHighlight = () => {
    if (highlights.length === 0) return;
    const filteredHighlights = highlights.filter(
      (h) =>
        !highlightFilter ||
        h.comment.text.toUpperCase().includes(highlightFilter.toUpperCase())
    );
    if (filteredHighlights.length === 0) return;

    let nextIndex = currentHighlightIndex + 1;
    if (nextIndex >= filteredHighlights.length) nextIndex = 0;

    setCurrentHighlightIndex(nextIndex);
    updateHash(filteredHighlights[nextIndex]);
  };

  // Listen for hash changes
  useEffect(() => {
    window.addEventListener('hashchange', scrollToHighlightFromHash, false);
    return () => {
      window.removeEventListener('hashchange', scrollToHighlightFromHash);
    };
  }, [highlights]);

  // Cleanup URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  return (
    <div className="pdf-viewer-container flex flex-col space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
          <CardDescription>
            Drag & drop your PDF document or click to select
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? 'Drop the PDF here'
                  : 'Drag & drop a PDF here, or click to select'}
              </p>
              <p className="text-xs text-gray-500">
                Only PDF files are accepted
              </p>
            </div>
          </div>

          {isLoading && (
            <div className="mt-4 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900"></div>
              <p className="mt-2 text-sm text-gray-600">Processing...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-red-700">
              <p className="text-sm font-medium">Error: {error}</p>
            </div>
          )}

          {message && !error && !isLoading && (
            <div className="mt-4 rounded-md bg-green-50 p-3 text-green-700">
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}

          {file && (
            <div className="mt-4 rounded-md bg-gray-50 p-3">
              <p className="text-sm font-medium">
                Current file: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Viewer */}
      {pdfUrl && (
        <Card>
          <CardHeader>
            <CardTitle>{file?.name || 'Document Viewer'}</CardTitle>
            <div className="flex justify-between space-x-2">
              <div className="flex space-x-2">
                <button
                  onClick={goToPreviousHighlight}
                  className="rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-700"
                  disabled={highlights.length === 0}
                >
                  Previous
                </button>
                <input
                  type="text"
                  placeholder="Filter highlights..."
                  value={highlightFilter}
                  onChange={(e) => setHighlightFilter(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={goToNextHighlight}
                  className="rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-700"
                  disabled={highlights.length === 0}
                >
                  Next
                </button>
              </div>
              <button
                onClick={saveHighlights}
                className="rounded-md bg-green-600 px-3 py-1 text-sm text-white transition-colors hover:bg-green-700"
                disabled={!file || isLoading}
              >
                Save Highlights
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="pdf-viewer-area flex h-[70vh]">
              {/* PDF with Highlighter */}
              <div className="pdf-document flex-grow overflow-hidden rounded-md border border-gray-200">
                <PdfLoader
                  url={pdfUrl}
                  beforeLoad={
                    <div className="flex h-full items-center justify-center">
                      Loading document...
                    </div>
                  }
                >
                  {(pdfDocument) => (
                    <PdfHighlighter
                      ref={pdfHighlighterRef}
                      pdfDocument={pdfDocument}
                      enableAreaSelection={(event) => event.altKey}
                      onScrollChange={resetHash}
                      onSelectionFinished={(
                        position,
                        content,
                        hideTipAndSelection,
                        transformSelection
                      ) => (
                        <div className="absolute z-10 rounded-md bg-white p-2 shadow-lg">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => {
                                addHighlight({
                                  content,
                                  position,
                                  comment: { text: 'ISSUE' }
                                });
                                hideTipAndSelection();
                              }}
                              className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
                            >
                              Issue
                            </button>
                            <button
                              onClick={() => {
                                addHighlight({
                                  content,
                                  position,
                                  comment: { text: 'LEGAL_TEST' }
                                });
                                hideTipAndSelection();
                              }}
                              className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800"
                            >
                              Legal Test
                            </button>
                            <button
                              onClick={() => {
                                addHighlight({
                                  content,
                                  position,
                                  comment: { text: 'CONCLUSION' }
                                });
                                hideTipAndSelection();
                              }}
                              className="rounded bg-green-100 px-2 py-1 text-xs text-green-800"
                            >
                              Conclusion
                            </button>
                          </div>
                        </div>
                      )}
                      scrollRef={(scrollTo) => {
                        if (pdfHighlighterRef.current) {
                          pdfHighlighterRef.current.scrollTo = scrollTo;
                        }
                      }}
                      highlightTransform={(
                        highlight,
                        index,
                        setTip,
                        hideTip,
                        viewportToScaled,
                        screenshot,
                        isScrolledTo
                      ) => (
                        <Popup
                          popupContent={<HighlightPopup {...highlight} />}
                          onMouseOver={(popupContent) =>
                            setTip(highlight, (highlight) => popupContent)
                          }
                          onMouseOut={hideTip}
                          key={index}
                        >
                          <StickyNote
                            isScrolledTo={isScrolledTo}
                            position={highlight.position}
                            comment={highlight.comment}
                          />
                          <AreaHighlight
                            highlight={highlight}
                            onChange={(boundingRect) => {
                              updateHighlight(
                                highlight.id,
                                {
                                  boundingRect: viewportToScaled(boundingRect)
                                },
                                { image: screenshot(boundingRect) }
                              );
                            }}
                          />
                        </Popup>
                      )}
                      highlights={highlights}
                    />
                  )}
                </PdfLoader>
              </div>

              {/* Sidebar with highlights and sections */}
              {showSidebar && (
                <div className="sidebar ml-4 flex w-96 flex-col overflow-hidden rounded-md border border-gray-200">
                  {/* Toggle tabs for Highlights/Sections */}
                  <div className="flex border-b border-gray-200">
                    <button
                      className={`flex-1 px-4 py-2 text-sm font-medium ${highlightFilter === '' ? 'border-b-2 border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                      onClick={() => setHighlightFilter('')}
                    >
                      All Highlights ({highlights.length})
                    </button>
                    <button
                      className={`flex-1 px-4 py-2 text-sm font-medium ${highlightFilter === 'ISSUE' ? 'border-b-2 border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                      onClick={() => setHighlightFilter('ISSUE')}
                    >
                      Issues
                    </button>
                    <button
                      className={`flex-1 px-4 py-2 text-sm font-medium ${highlightFilter === 'LEGAL_TEST' ? 'border-b-2 border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                      onClick={() => setHighlightFilter('LEGAL_TEST')}
                    >
                      Tests
                    </button>
                  </div>

                  {/* Highlights Section */}
                  <div className="highlights-container flex-grow overflow-y-auto">
                    <div className="p-2">
                      {highlights.length > 0 ? (
                        highlights
                          .filter(
                            (h) =>
                              !highlightFilter ||
                              h.comment.text
                                .toUpperCase()
                                .includes(highlightFilter.toUpperCase())
                          )
                          .map((highlight, index) => (
                            <div
                              key={highlight.id}
                              className={`mb-2 cursor-pointer rounded border p-2 ${
                                index === currentHighlightIndex
                                  ? 'border-blue-300 bg-blue-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                setCurrentHighlightIndex(index);
                                updateHash(highlight);
                              }}
                            >
                              <div
                                className={`mb-1 inline-block rounded-full px-2 py-1 text-xs ${getHighlightClass(highlight.comment.text)}`}
                              >
                                {highlight.comment.text}
                              </div>
                              {highlight.content.text && (
                                <div className="mt-1 text-xs text-gray-600">
                                  {`${highlight.content.text.slice(0, 80).trim()}${
                                    highlight.content.text.length > 80
                                      ? '...'
                                      : ''
                                  }`}
                                </div>
                              )}
                            </div>
                          ))
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No highlights yet. Select text to add highlights.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Sections */}
                  {documentSections.length > 0 && (
                    <div className="sections-container mt-4 border-t border-gray-200">
                      <DocumentAccordion
                        sections={documentSections}
                        title="Document Sections"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Toggle sidebar button */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 shadow-md hover:bg-gray-100"
                aria-label={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {showSidebar ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  )}
                </svg>
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PDFViewer;
