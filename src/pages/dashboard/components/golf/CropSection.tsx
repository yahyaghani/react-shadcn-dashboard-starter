import React, { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Search, Play, Pause, Film } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface CropsSectionProps {
  crops: any[];
  onDelete: (cropId: string) => void;
  onIdentify: () => void;
}

const CropsSection: React.FC<CropsSectionProps> = ({
  crops,
  onDelete,
  onIdentify
}) => {
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Function to toggle video expansion
  const toggleVideoExpansion = (cropId: string) => {
    if (expandedVideo === cropId) {
      setExpandedVideo(null);
      setIsPlaying(false);
    } else {
      setExpandedVideo(cropId);
      setIsPlaying(false);
    }
  };

  // Function to toggle play/pause
  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  // Function to get a video URL for a crop
  const getVideoUrl = (cropId: string) => {
    // In a real application, this would be a URL to your server/API
    const serverBaseUrl =
      import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5012';
    return `${serverBaseUrl}/api/cropped/${cropId}`;
  };

  return (
    <div className="space-y-6">
      {crops.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No cropped videos yet
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {crops.map((crop) => (
              <Card key={crop.crop_id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    <span>{crop.golfer_id}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVideoExpansion(crop.crop_id)}
                      className="h-8 w-8 p-0"
                    >
                      <Film className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pb-2 text-sm">
                  <p
                    className="truncate text-muted-foreground"
                    title={crop.filename}
                  >
                    Original: {crop.filename}
                  </p>
                  <p className="font-mono text-muted-foreground">
                    Frames: {crop.startFrame} - {crop.endFrame}
                  </p>

                  {/* Video Preview Expand/Collapse */}
                  {expandedVideo === crop.crop_id && (
                    <div className="mt-3 space-y-2">
                      <div className="relative aspect-video overflow-hidden rounded-md bg-gray-900">
                        <video
                          ref={videoRef}
                          src={getVideoUrl(crop.crop_id)}
                          className="h-full w-full"
                          onEnded={() => setIsPlaying(false)}
                          loop={false}
                        />

                        {/* Playback Control */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button
                            onClick={togglePlayPause}
                            className="rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                          >
                            {isPlaying ? (
                              <Pause className="h-6 w-6" />
                            ) : (
                              <Play className="h-6 w-6" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedVideo(null)}
                        >
                          Close Preview
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
                    onClick={() => onDelete(crop.crop_id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="px-8">
                  <Search className="mr-2 h-4 w-4" />
                  Identify Golfers
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Run Identification</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will analyze {crops.length} cropped swing(s) and
                    attempt to identify the golfer(s). The process may take a
                    few moments.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onIdentify}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="mt-6 rounded-lg bg-muted/50 p-6">
            <h3 className="mb-2 text-lg font-medium">Instructions</h3>
            <p className="mb-2 text-muted-foreground">
              You've cropped {crops.length} golf swing(s). Click "Identify
              Golfers" to run the identification model on these swings.
            </p>
            <p className="text-muted-foreground">
              The model will compare these swings to the database and identify
              the most likely golfer for each swing.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default CropsSection;
