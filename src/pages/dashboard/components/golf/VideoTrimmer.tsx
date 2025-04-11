import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  BsCloudUploadFill,
  BsFillPlayFill,
  BsFillPauseFill
} from 'react-icons/bs';
import { MdCloseFullscreen, MdOpenInFull } from 'react-icons/md';
import {
  AiOutlineReload,
  AiFillStepBackward,
  AiFillStepForward
} from 'react-icons/ai';
import { AlertTriangle } from 'lucide-react';
import { validateVideoFileAsync } from '@/services/video-service';

interface VideoTrimmerProps {
  videoFile: File;
  onTrim: (startFrame: number, endFrame: number) => void;
  onCancel: () => void;
  initialFrames?: { start: number; end: number };
  keyFrames?: Record<string, number>;
  fps?: number;
}

const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
  videoFile,
  onTrim,
  onCancel,
  initialFrames,
  keyFrames,
  fps = 30
}) => {
  // Video state
  const [videoURL, setVideoURL] = useState<string>('');
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  // Trimming state
  const [startTime, setStartTime] = useState(
    initialFrames?.start ? initialFrames.start / fps : 0
  );
  const [endTime, setEndTime] = useState(
    initialFrames?.end ? initialFrames.end / fps : 0
  );
  const [sliderPosition, setSliderPosition] = useState(0);

  // References
  const progressBarRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Validate and load video
  useEffect(() => {
    const loadVideo = async () => {
      try {
        // Reset previous states
        setVideoLoadError(null);
        setVideoURL('');

        // Validate video file
        const isValidVideo = await validateVideoFileAsync(videoFile);
        if (!isValidVideo) {
          throw new Error(
            'Invalid video file. Please check the file and try again.'
          );
        }

        // Create object URL
        const url = URL.createObjectURL(videoFile);
        setVideoURL(url);

        // Cleanup function
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (error) {
        console.error('Video load error:', error);
        setVideoLoadError(
          error instanceof Error ? error.message : 'Failed to load video file'
        );
      }
    };

    loadVideo();
  }, [videoFile]);

  // Video metadata load handler
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;

      // Validate video duration
      if (videoDuration <= 0 || videoDuration > 3600) {
        setVideoLoadError(
          'Invalid video duration. Please upload a video between 1 second and 1 hour.'
        );
        return;
      }

      setDuration(videoDuration);

      // Set initial end time to video duration if not specified
      if (!initialFrames?.end) {
        setEndTime(videoDuration);
      }
    }
  };

  // Error rendering
  const renderVideoError = () => {
    if (!videoLoadError) return null;

    return (
      <div className="m-4 flex items-center space-x-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <div>
          <h3 className="font-bold text-red-700">Video Load Error</h3>
          <p className="text-red-600">{videoLoadError}</p>
          <div className="mt-3 flex space-x-2">
            <Button variant="destructive" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVideoLoadError(null)}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Time formatting utility
  const formatTime = (seconds: number) => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  };

  // Player control functions
  const handlePlay = () => {
    if (videoRef.current) {
      // If current time is past end time or before start time, seek to start time
      if (
        videoRef.current.currentTime >= endTime ||
        videoRef.current.currentTime < startTime
      ) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    videoRef.current?.pause();
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      setCurrentTime(currentTime);

      // Update slider position
      const position = (currentTime / duration) * 100;
      setSliderPosition(position);

      // Auto-pause when reaching end time
      if (currentTime >= endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleReload = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
    }
  };

  const handleStepBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
    }
  };

  const handleStepForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = endTime;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setFullscreen(!fullscreen);
    }
  };

  // Range slider interaction
  const handleRangeInteraction = (clientX: number, type: 'min' | 'max') => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const width = rect.width;
    const offsetX = clientX - rect.left;
    const percentage = Math.min(Math.max(offsetX / width, 0), 1);
    const timeValue = percentage * duration;

    if (type === 'min') {
      // Ensure start time doesn't exceed end time
      const newStartTime = Math.min(timeValue, endTime - 0.1);
      setStartTime(newStartTime);
    } else {
      // Ensure end time doesn't go before start time
      const newEndTime = Math.max(timeValue, startTime + 0.1);
      setEndTime(newEndTime);
    }
  };

  // Handle trimming confirmation
  const handleTrimConfirm = () => {
    // Convert times to frames
    const startFrame = Math.round(startTime * fps);
    const endFrame = Math.round(endTime * fps);
    onTrim(startFrame, endFrame);
  };

  // Jump to key frame
  const handleJumpToKeyFrame = (frame: number) => {
    if (videoRef.current) {
      const time = frame / fps;
      videoRef.current.currentTime = time;
    }
  };

  // Render main component
  return (
    <div className="video-trimmer w-full overflow-hidden rounded-lg bg-gray-900">
      {/* Error Display */}
      {renderVideoError()}

      {/* Main Video Container - Only show if no error */}
      {!videoLoadError && (
        <>
          <div className="video-container relative">
            {videoURL && (
              <video
                ref={videoRef}
                src={videoURL}
                className="h-[400px] w-full bg-black"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                muted
              />
            )}

            {/* Playback Controls */}
            <div className="playback-controls flex items-center justify-between bg-gray-800 p-4">
              <div className="time-display text-white">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              <div className="fullscreen-button">
                <button
                  onClick={toggleFullscreen}
                  className="rounded-full p-2 text-white hover:bg-gray-700"
                >
                  {fullscreen ? (
                    <MdCloseFullscreen size="1.5em" />
                  ) : (
                    <MdOpenInFull size="1.5em" />
                  )}
                </button>
              </div>
            </div>

            {/* Player Controls */}
            <div className="player-controls grid grid-cols-5 gap-2 bg-gray-800 p-4">
              <button
                onClick={handleReload}
                className="flex items-center justify-center rounded-full p-2 text-white hover:bg-gray-700"
              >
                <AiOutlineReload size="2em" />
              </button>

              <button
                onClick={handleStepBackward}
                className="flex items-center justify-center rounded-full p-2 text-white hover:bg-gray-700"
              >
                <AiFillStepBackward size="2em" />
              </button>

              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="flex items-center justify-center rounded-full p-2 text-white hover:bg-gray-700"
              >
                {isPlaying ? (
                  <BsFillPauseFill size="2em" />
                ) : (
                  <BsFillPlayFill size="2em" />
                )}
              </button>

              <button
                onClick={handleStepForward}
                className="flex items-center justify-center rounded-full p-2 text-white hover:bg-gray-700"
              >
                <AiFillStepForward size="2em" />
              </button>

              <button
                onClick={handleTrimConfirm}
                className="flex items-center justify-center rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
              >
                <BsCloudUploadFill className="mr-2" />
                <span>Trim & Upload</span>
              </button>
            </div>

            {/* Range Slider */}
            <div className="range-slider bg-gray-800 p-4 pb-8 pt-8">
              <div
                ref={sliderRef}
                className="relative mt-2 h-10 w-full cursor-pointer"
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const offsetX = e.clientX - rect.left;
                  const width = rect.width;
                  const percentage = offsetX / width;

                  // Determine if closer to min or max handle
                  const startPos = (startTime / duration) * 100;
                  const endPos = (endTime / duration) * 100;
                  const currentPercentage = percentage * 100;

                  const type =
                    Math.abs(currentPercentage - startPos) <
                    Math.abs(currentPercentage - endPos)
                      ? 'min'
                      : 'max';

                  handleRangeInteraction(e.clientX, type);
                }}
              >
                {/* Range slider content remains the same */}
                {/* ... (previous slider code) ... */}
              </div>

              {/* Key Frames */}
              {keyFrames && Object.keys(keyFrames).length > 0 && (
                <div className="key-frames mt-8">
                  <h4 className="mb-2 text-sm text-white">Key Frames:</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(keyFrames).map(([key, frame]) => (
                      <button
                        key={key}
                        onClick={() => handleJumpToKeyFrame(frame)}
                        className="rounded bg-primary/20 px-2 py-1 text-xs text-white hover:bg-primary/30"
                      >
                        {key}: {frame}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="actions flex justify-end space-x-3 border-t border-gray-700 bg-gray-800 p-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleTrimConfirm}>Apply Trim</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoTrimmer;
