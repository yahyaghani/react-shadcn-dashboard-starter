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
  Search,
  CheckCircle,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import VideoTrimmer from './VideoTrimmer';
import golfApi from '../../../../services/golf-api';

interface VerificationSectionProps {
  golferId: string;
  onBackToTraining: () => void;
}

const VerificationSection: React.FC<VerificationSectionProps> = ({
  golferId,
  onBackToTraining
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [cropId, setCropId] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<
    'idle' | 'uploading' | 'analyzing' | 'cropping' | 'verifying' | 'completed'
  >('idle');
  const [progressValue, setProgressValue] = useState(0);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [keyFrames, setKeyFrames] = useState<any>(null);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Set up an interval to simulate progress during processing
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;

    if (processingStage === 'uploading' && progressValue < 25) {
      progressInterval = setInterval(() => {
        setProgressValue((prev) => Math.min(prev + 1, 25));
      }, 300);
    } else if (processingStage === 'analyzing' && progressValue < 45) {
      progressInterval = setInterval(() => {
        setProgressValue((prev) => Math.min(prev + 1, 45));
      }, 400);
    } else if (processingStage === 'cropping' && progressValue < 75) {
      progressInterval = setInterval(() => {
        setProgressValue((prev) => Math.min(prev + 0.5, 75));
      }, 300);
    } else if (processingStage === 'verifying' && progressValue < 95) {
      progressInterval = setInterval(() => {
        setProgressValue((prev) => Math.min(prev + 0.25, 95));
      }, 200);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [processingStage, progressValue]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setTestFile(files[0]);

      // Reset states for new verification
      setUploadId(null);
      setCropId(null);
      setKeyFrames(null);
      setVerificationResult(null);
      setProcessingStage('idle');
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
      setTestFile(e.dataTransfer.files[0]);

      // Reset states for new verification
      setUploadId(null);
      setCropId(null);
      setKeyFrames(null);
      setVerificationResult(null);
      setProcessingStage('idle');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Clear the selected file
  const clearFile = () => {
    setTestFile(null);
    setUploadId(null);
    setCropId(null);
    setKeyFrames(null);
    setVerificationResult(null);
    setProcessingStage('idle');
  };

  // Start the verification process
  const startVerification = async () => {
    if (!testFile) {
      setError('Please select a video file');
      return;
    }

    if (!golferId) {
      setError('No golfer ID specified for verification');
      return;
    }

    setLoading(true);
    setError(null);
    setProcessingStage('uploading');
    setProgressValue(5); // Start at 5%

    try {
      // Step 1: Upload
      console.log(`Uploading verification file: ${testFile.name}`);
      const uploadResponse = await golfApi.uploadVideo(testFile, 'verify_test');
      console.log('Upload response:', uploadResponse);

      setUploadId(uploadResponse.upload_id);
      setProgressValue(30);

      // Step 2: Analyze
      setProcessingStage('analyzing');
      console.log(`Analyzing video: ${uploadResponse.upload_id}`);
      const analyzeResponse = await golfApi.analyzeVideo(
        uploadResponse.upload_id
      );
      console.log('Analyze response:', analyzeResponse);

      setKeyFrames(analyzeResponse.key_frames);
      setProgressValue(50);

      // Set video for trimmer
      setVideoFile(testFile);

      // Show the trimmer
      console.log('Opening video trimmer');
      setShowTrimmer(true);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to process video');
      setProcessingStage('idle');
      setLoading(false);
    }
  };

  // Handle trim completion
  const handleTrimComplete = async (startFrame: number, endFrame: number) => {
    console.log(`Trim complete: ${startFrame} - ${endFrame}`);
    setShowTrimmer(false);

    if (!uploadId) {
      setError('Upload ID is missing');
      return;
    }

    try {
      setProcessingStage('cropping');
      setProgressValue(70);

      // Step 3: Crop
      console.log(
        `Cropping video: ${uploadId}, frames ${startFrame}-${endFrame}`
      );
      const cropResponse = await golfApi.cropVideo({
        uploadId,
        startFrame,
        endFrame,
        golferId: 'verify_test'
      });
      console.log('Crop response:', cropResponse);

      setCropId(cropResponse.crop_id);
      setProgressValue(80);

      // Step 4: Verify
      setProcessingStage('verifying');
      console.log(
        `Verifying golfer: crop_id=${cropResponse.crop_id}, golfer_id=${golferId}`
      );
      const verifyResponse = await golfApi.verifyGolfer(
        cropResponse.crop_id,
        golferId
      );
      console.log('Verify response:', verifyResponse);

      setVerificationResult(verifyResponse);
      setProgressValue(100);
      setProcessingStage('completed');
    } catch (err: any) {
      console.error('Verification error after trim:', err);
      setError(err.message || 'Failed to verify golfer');
      setProcessingStage('idle');
    } finally {
      setLoading(false);
    }
  };

  // Handle trim cancellation
  const handleTrimCancel = () => {
    console.log('Trim cancelled');
    setShowTrimmer(false);
    setProcessingStage('idle');
    setLoading(false);
  };

  // Start new verification
  const newVerification = () => {
    setTestFile(null);
    setUploadId(null);
    setCropId(null);
    setKeyFrames(null);
    setVerificationResult(null);
    setProcessingStage('idle');
  };

  return (
    <div className="space-y-6">
      {/* Trimmer Modal */}
      {showTrimmer && videoFile && keyFrames && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-lg bg-gray-900">
            <VideoTrimmer
              videoFile={videoFile}
              onTrim={handleTrimComplete}
              onCancel={handleTrimCancel}
              keyFrames={keyFrames}
              initialFrames={{
                start: keyFrames?.address || 0,
                end: keyFrames?.finish || 100
              }}
            />
          </div>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span>Verify Golfer: {golferId}</span>
              {processingStage === 'completed' && (
                <Badge
                  variant={
                    verificationResult?.is_match ? 'default' : 'destructive'
                  }
                  className="ml-2"
                >
                  {verificationResult?.is_match ? 'Match' : 'No Match'}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToTraining}
              disabled={loading}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Training
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            Upload a new video to verify if the swing belongs to golfer{' '}
            <strong>{golferId}</strong>.
          </p>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {processingStage === 'idle' && !testFile && (
            <div
              className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors
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
              <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop a video file, or click to browse
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Select a video to verify if it's golfer: {golferId}
              </p>
            </div>
          )}

          {processingStage === 'idle' && testFile && (
            <div className="rounded-md border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{testFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(testFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Processing Progress */}
          {(processingStage === 'uploading' ||
            processingStage === 'analyzing' ||
            processingStage === 'cropping' ||
            processingStage === 'verifying') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {processingStage === 'uploading' && 'Uploading Video...'}
                  {processingStage === 'analyzing' && 'Analyzing Swing...'}
                  {processingStage === 'cropping' && 'Processing Swing...'}
                  {processingStage === 'verifying' && 'Verifying Golfer...'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {progressValue.toFixed(0)}%
                </span>
              </div>
              <Progress value={progressValue} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {processingStage === 'uploading' &&
                  'Uploading your video to the server...'}
                {processingStage === 'analyzing' &&
                  'Analyzing swing mechanics and detecting key frames...'}
                {processingStage === 'cropping' && 'Processing swing data...'}
                {processingStage === 'verifying' &&
                  'Comparing swing to golfer profile...'}
              </p>
              <div className="mt-4 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </div>
          )}

          {/* Results */}
          {processingStage === 'completed' && verificationResult && (
            <div className="space-y-4">
              <div
                className={`rounded-md border ${verificationResult.is_match ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} p-4`}
              >
                <div className="flex items-center gap-2">
                  {verificationResult.is_match ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-700">
                        Match Confirmed
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium text-red-700">
                        No Match
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-sm">
                    <strong>Confidence:</strong>{' '}
                    {(verificationResult.confidence * 100).toFixed(2)}%
                  </p>

                  <div className="h-2.5 w-full rounded-full bg-muted">
                    <div
                      className={`h-2.5 rounded-full ${verificationResult.is_match ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{
                        width: `${verificationResult.confidence * 100}%`
                      }}
                    ></div>
                  </div>

                  <p className="mt-2 text-sm">
                    <strong>Analysis:</strong> This swing was compared against{' '}
                    {verificationResult.training_samples_count} training samples
                    for golfer {golferId}.
                  </p>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {verificationResult.best_match_position && (
                      <div className="rounded bg-muted p-2 text-center">
                        <p className="text-xs text-muted-foreground">
                          Best Match Position
                        </p>
                        <p className="font-mono text-sm">
                          {verificationResult.best_match_position}
                        </p>
                      </div>
                    )}
                    {verificationResult.best_match_distance !== undefined && (
                      <div className="rounded bg-muted p-2 text-center">
                        <p className="text-xs text-muted-foreground">
                          Best Distance
                        </p>
                        <p className="font-mono text-sm">
                          {verificationResult.best_match_distance.toFixed(4)}
                        </p>
                      </div>
                    )}
                    <div className="rounded bg-muted p-2 text-center">
                      <p className="text-xs text-muted-foreground">
                        Database Size
                      </p>
                      <p className="font-mono text-sm">
                        {verificationResult.total_database_size ||
                          verificationResult.training_samples_count}
                      </p>
                    </div>
                  </div>

                  {/* Display top matches if available */}
                  {verificationResult.top_matches &&
                    verificationResult.top_matches.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium">Top Matches:</p>
                        <div className="space-y-1 text-sm">
                          {verificationResult.top_matches.map(
                            (match: any, index: number) => (
                              <div
                                key={index}
                                className={`flex justify-between rounded p-2 ${match.is_target_golfer ? 'bg-green-100' : 'bg-muted'}`}
                              >
                                <span>
                                  {index + 1}. {match.golfer_id}
                                </span>
                                <span className="font-mono">
                                  {match.distance.toFixed(4)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {processingStage === 'idle' && testFile && (
            <>
              <Button variant="outline" onClick={clearFile} disabled={loading}>
                Clear
              </Button>
              <Button
                onClick={startVerification}
                disabled={!testFile || !golferId || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Verify Swing
                  </>
                )}
              </Button>
            </>
          )}

          {processingStage === 'completed' && (
            <Button onClick={newVerification}>
              <Upload className="mr-2 h-4 w-4" />
              Verify Another Video
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Information Card */}
      {processingStage === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How Verification Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Upload a video of a golf swing you want to verify.</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>
                  The system will extract the swing mechanics and key frames.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>
                  You'll be able to trim the video to focus on just the swing.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>
                  The system will compare this swing to your training data for
                  golfer <strong>{golferId}</strong>.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>
                  You'll get a result showing if the swing matches the golfer's
                  profile.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VerificationSection;
