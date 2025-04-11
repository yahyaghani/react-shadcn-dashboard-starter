// This service manages file storage for the application
// In a real app, these functions would interact with your backend API

// Map to store uploaded videos by ID
const uploadedVideos = new Map<string, File>();

// Map to store video URLs by ID
const videoUrls = new Map<string, string>();

/**
 * Stores a video file and returns an identifier
 */
export const storeVideo = (file: File): string => {
  const id = generateId();
  uploadedVideos.set(id, file);

  // Create a blob URL for the file
  const url = URL.createObjectURL(file);
  videoUrls.set(id, url);

  return id;
};

/**
 * Retrieves a video file by ID
 */
export const getVideo = (id: string): File | undefined => {
  return uploadedVideos.get(id);
};

/**
 * Gets a URL for a video by ID
 */
export const getVideoUrl = (id: string): string | undefined => {
  return videoUrls.get(id);
};

/**
 * Removes a video and cleans up resources
 */
export const removeVideo = (id: string): boolean => {
  const url = videoUrls.get(id);
  if (url) {
    URL.revokeObjectURL(url);
  }

  const hasFile = uploadedVideos.delete(id);
  videoUrls.delete(id);

  return hasFile;
};

/**
 * Simulates cropping a video (creates a new entry)
 */
export const cropVideo = (
  sourceId: string,
  startFrame: number,
  endFrame: number
): string => {
  const sourceFile = uploadedVideos.get(sourceId);
  if (!sourceFile) {
    throw new Error(`Source video with ID ${sourceId} not found`);
  }

  // In a real app, you would actually trim the video here
  // For this demo, we'll just pretend to trim it and return a copy

  // Create a new ID for the cropped video
  const croppedId = generateId();

  // Store the same file (simulating a cropped version)
  uploadedVideos.set(croppedId, sourceFile);

  // Create a new URL for the "cropped" video
  const url = URL.createObjectURL(sourceFile);
  videoUrls.set(croppedId, url);

  return croppedId;
};

/**
 * Generates a random ID
 */
const generateId = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

/**
 * Cleans up all resources
 */
export const cleanup = (): void => {
  // Revoke all object URLs
  for (const url of videoUrls.values()) {
    URL.revokeObjectURL(url);
  }

  // Clear the maps
  uploadedVideos.clear();
  videoUrls.clear();
};
