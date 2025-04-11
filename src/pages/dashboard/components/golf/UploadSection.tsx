import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Upload, Trash2, Loader2, Video, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VideoTrimmer from './VideoTrimmer';
import golfApi from '../../../../services/golf-api';
import * as fileService from '../../../../services/file-service';
import { fetchVideoFile } from '../../../../services/video-service';

interface UploadSectionProps {
  uploads: any[];
  onUpload: (file: File) => void;
  onDelete: (uploadId: string) => void;
  onCrop: (upload: any, startFrame: number, endFrame: number) => void;
  onReAnalyze?: (upload: any) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({
  uploads,
  onUpload,
  onDelete,
  onCrop,
  onReAnalyze
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [trimmerVisible, setTrimmerVisible] = useState(false);
  const [activeUpload, setActiveUpload] = useState<any>(null);
  const [isReanalyzing, setIsReanalyzing] = useState<string | null>(null);
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset the input value so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Function to open the video trimmer
  const openTrimmer = async (upload: any) => {
    try {
      // Reset any previous video load errors
      setVideoLoadError(null);

      console.log('Opening Trimmer for Upload:', upload);

      // Ensure videoUrl is used
      if (!upload.videoUrl) {
        throw new Error('No video URL available');
      }

      // Fetch video file
      const videoFile = await fetchVideoFile(upload.videoUrl);

      console.log('Fetched Video File:', videoFile);

      setActiveUpload({ ...upload, file: videoFile });
      setTrimmerVisible(true);
    } catch (error) {
      console.error('Error in openTrimmer:', error);

      const errorMessage =
        error instanceof Error
          ? `Failed to load video: ${error.message}`
          : 'Failed to load video';

      setVideoLoadError(errorMessage);
    }
  };
  // Function to handle trim completion
  const handleTrimComplete = (startFrame: number, endFrame: number) => {
    if (activeUpload) {
      onCrop(activeUpload, startFrame, endFrame);
    }
    setTrimmerVisible(false);
    setActiveUpload(null);
  };

  // Function to cancel trimming
  const handleTrimCancel = () => {
    setTrimmerVisible(false);
    setActiveUpload(null);
    setVideoLoadError(null);
  };

  // Function to re-analyze a failed upload
  const handleReAnalyze = async (upload: any) => {
    if (!onReAnalyze) return;

    setIsReanalyzing(upload.upload_id);
    try {
      await onReAnalyze(upload);
    } catch (error) {
      console.error('Re-analysis failed', error);
    } finally {
      setIsReanalyzing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Video Trimmer Modal */}
      {trimmerVisible && activeUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-lg bg-gray-900">
            {videoLoadError ? (
              <div className="p-6 text-center">
                <h2 className="mb-4 text-xl text-red-500">Video Load Error</h2>
                <p className="mb-4 text-white">{videoLoadError}</p>
                <div className="flex justify-center space-x-4">
                  <Button variant="outline" onClick={handleTrimCancel}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => openTrimmer(activeUpload)}
                  >
                    Retry Loading
                  </Button>
                </div>
              </div>
            ) : (
              <VideoTrimmer
                videoFile={
                  activeUpload.file ||
                  new File([], activeUpload.filename, { type: 'video/mp4' })
                }
                onTrim={handleTrimComplete}
                onCancel={handleTrimCancel}
                keyFrames={activeUpload.keyFrames}
                initialFrames={{
                  start: activeUpload.keyFrames?.address || 0,
                  end: activeUpload.keyFrames?.finish || 100
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* File Upload Dropzone */}
      <div
        className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*"
          className="hidden"
        />
        <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag and drop a video file, or click to browse
        </p>
      </div>

      {/* Uploaded Videos List */}
      <div className="space-y-4">
        <h3 className="text-xl font-medium">Uploaded Videos</h3>

        {uploads.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No videos uploaded yet
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {uploads.map((upload) => (
              <Card key={upload.upload_id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle
                      className="truncate text-sm"
                      title={upload.filename}
                    >
                      {upload.filename}
                    </CardTitle>
                    <StatusBadge status={upload.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Golfer ID: {upload.golfer_id}
                  </p>

                  {upload.status === 'analyzing' && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Analyzing video...
                      </span>
                    </div>
                  )}

                  {upload.status === 'failed' && (
                    <div className="space-y-2">
                      <Alert variant="destructive" className="py-2">
                        <AlertDescription>{upload.error}</AlertDescription>
                      </Alert>

                      {onReAnalyze && (
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full"
                          disabled={isReanalyzing === upload.upload_id}
                          onClick={() => handleReAnalyze(upload)}
                        >
                          {isReanalyzing === upload.upload_id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Retry Analysis
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {upload.status === 'analyzed' && upload.keyFrames && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Frames:</h4>
                      <ul className="space-y-1 text-xs">
                        {Object.entries(upload.keyFrames).map(
                          ([key, frame]) => (
                            <li key={key} className="flex justify-between">
                              <span className="capitalize">{key}:</span>
                              <span className="font-mono">
                                {frame as React.ReactNode}
                              </span>
                            </li>
                          )
                        )}
                      </ul>

                      <div className="space-y-2 pt-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full"
                          onClick={() => openTrimmer(upload)}
                        >
                          <Video className="mr-1 h-3 w-3" />
                          Edit & Crop Video
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={() => onDelete(upload.upload_id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Status badge component
interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const variants: Record<
    string,
    {
      variant: 'outline' | 'secondary' | 'destructive' | 'default';
      label: string;
    }
  > = {
    uploaded: { variant: 'outline', label: 'Uploaded' },
    analyzing: { variant: 'secondary', label: 'Analyzing' },
    analyzed: { variant: 'default', label: 'Analyzed' },
    failed: { variant: 'destructive', label: 'Failed' }
  };

  const { variant, label } = variants[status] || variants.uploaded;

  return (
    <Badge variant={variant} className="ml-2">
      {label}
    </Badge>
  );
};

export default UploadSection;
