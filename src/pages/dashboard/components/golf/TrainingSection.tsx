import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Upload,
  Trash2,
  Loader2,
  Database,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import golfApi from '../../../../services/golf-api';

interface TrainingSectionProps {
  golferId: string;
  onTrainingComplete: () => void;
  isTrainingComplete?: boolean;
}

const TrainingSection: React.FC<TrainingSectionProps> = ({
  golferId,
  onTrainingComplete,
  isTrainingComplete = false
}) => {
  // If training is already complete, jump to the completed state
  useEffect(() => {
    if (isTrainingComplete) {
      setProcessingStatus('completed');
      setUploadProgress(100);
    }
  }, [isTrainingComplete]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [trainingSession, setTrainingSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<
    'idle' | 'uploading' | 'processing' | 'completed' | 'failed'
  >('idle');

  // Set up an interval to simulate progress during processing
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;

    if (processingStatus === 'uploading' && uploadProgress < 40) {
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 1, 40));
      }, 500);
    } else if (processingStatus === 'processing' && uploadProgress < 90) {
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 0.5, 90));
      }, 1000);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [processingStatus, uploadProgress]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setSelectedFiles((prev) => [...prev, ...fileArray]);
    }
    // Reset the input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop
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
      const fileArray = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...fileArray]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Remove a selected file
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear all selected files
  const clearFiles = () => {
    setSelectedFiles([]);
  };

  // Start the batch upload process
  const startTraining = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one video file');
      return;
    }

    if (!golferId) {
      setError('Please enter a golfer ID before training');
      return;
    }

    setLoading(true);
    setError(null);
    setProcessingStatus('uploading');
    setUploadProgress(5); // Start at 5% to show immediate feedback

    try {
      // Batch upload all files
      console.log(
        `Starting batch upload of ${selectedFiles.length} files for golfer ${golferId}`
      );
      const uploadResponse = await golfApi.batchTrainingUpload(
        selectedFiles,
        golferId
      );
      console.log('Upload response:', uploadResponse);

      setTrainingSession(uploadResponse);
      setUploadProgress(50);

      // Process the training session
      setProcessingStatus('processing');
      console.log(
        `Processing training session: ${uploadResponse.training_session_id}`
      );
      const processResponse = await golfApi.processTrainingSession(
        uploadResponse.training_session_id
      );
      console.log('Process response:', processResponse);

      setTrainingSession(processResponse);
      setUploadProgress(100);
      setProcessingStatus('completed');

      // Notify parent component that training is complete
      onTrainingComplete();
    } catch (err: any) {
      console.error('Training error:', err);
      setError(err.message || 'Failed to train the model');
      setProcessingStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Training: {golferId || 'Unknown Golfer'}</span>
            <Badge
              variant={
                !golferId
                  ? 'destructive'
                  : processingStatus === 'completed'
                    ? 'default'
                    : 'outline'
              }
              className="ml-2"
            >
              {!golferId
                ? 'No Golfer ID'
                : processingStatus === 'completed'
                  ? 'Training Complete'
                  : 'Ready'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            Upload multiple videos of the same golfer to train the system to
            recognize their swing. Make sure all videos belong to golfer:{' '}
            <strong>{golferId || 'Please set a golfer ID'}</strong>
          </p>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {processingStatus === 'idle' && (
            <>
              {/* File Upload Dropzone */}
              <div
                className={`mb-4 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors
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
                  multiple
                  className="hidden"
                />
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop video files, or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select multiple videos of {golferId || 'this golfer'}
                </p>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="max-h-64 space-y-2 overflow-y-auto p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Selected Videos ({selectedFiles.length})
                    </h4>
                    <Button variant="ghost" size="sm" onClick={clearFiles}>
                      Clear All
                    </Button>
                  </div>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md bg-muted p-2"
                    >
                      <div className="mr-2 flex-1 truncate">
                        <p className="truncate text-sm" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Processing Status */}
          {(processingStatus === 'uploading' ||
            processingStatus === 'processing') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {processingStatus === 'uploading'
                    ? 'Uploading Files...'
                    : 'Processing Videos...'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {uploadProgress.toFixed(0)}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {processingStatus === 'uploading'
                  ? 'Uploading videos to the server...'
                  : 'Processing swing data and creating training models...'}
              </p>
              <div className="mt-4 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </div>
          )}

          {processingStatus === 'completed' && (
            <div className="space-y-4">
              <div className="rounded-md border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    Training Completed Successfully
                  </span>
                </div>
                {trainingSession ? (
                  <p className="mt-2 text-sm">
                    Successfully processed {trainingSession.processed_videos}{' '}
                    out of {trainingSession.total_videos} videos.
                  </p>
                ) : (
                  <p className="mt-2 text-sm">
                    The system is now trained with videos of golfer{' '}
                    <strong>{golferId}</strong>.
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  You can now verify if a new swing belongs to{' '}
                  <strong>{golferId}</strong>.
                </p>
              </div>
            </div>
          )}

          {processingStatus === 'failed' && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Training Failed
                </span>
              </div>
              <p className="mt-2 text-sm">
                There was an error during the training process. Please try
                again.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setProcessingStatus('idle')}
              >
                Reset and Try Again
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {processingStatus === 'idle' && (
            <>
              <Button
                variant="outline"
                disabled={selectedFiles.length === 0}
                onClick={clearFiles}
              >
                Clear
              </Button>
              <Button
                disabled={selectedFiles.length === 0 || !golferId || loading}
                onClick={startTraining}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Train Model
                  </>
                )}
              </Button>
            </>
          )}

          {processingStatus === 'completed' && (
            <Button onClick={onTrainingComplete}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Continue to Verification
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Information Card */}
      {processingStatus === 'idle' && selectedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Training Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>
                  The training process will upload and analyze all selected
                  videos.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>
                  Each video will be processed to extract the golf swing
                  mechanics.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>
                  The system will create a profile for golfer{' '}
                  <strong>{golferId}</strong> based on these swings.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>
                  This profile will be used to verify if new swings belong to
                  this golfer.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrainingSection;
