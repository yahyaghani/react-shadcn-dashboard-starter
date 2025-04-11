import axios from 'axios';

// Base URL from environment or default
const BASE_URL = import.meta.env?.VITE_BASE_URL || 'http://localhost:5012';

export const fetchVideoFile = async (videoUrl: string): Promise<File> => {
  try {
    console.group('Video Fetch Debugging');
    console.log('Attempting to fetch video:', videoUrl);

    // Ensure full URL
    const fullUrl = videoUrl.startsWith('http')
      ? videoUrl
      : `${BASE_URL}${videoUrl}`;

    console.log('Full Video URL:', fullUrl);

    // Use fetch with more detailed error handling
    const response = await fetch(fullUrl, {
      method: 'GET',
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'include', // Include credentials if needed
      headers: {
        Accept: 'video/*',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
      }
    });

    // Check response status
    if (!response.ok) {
      console.error('Fetch Response:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get blob from response
    const blob = await response.blob();

    // Extract filename from URL or use default
    const filename = videoUrl.split('/').pop() || 'video.mp4';

    console.log('Blob details:', {
      type: blob.type,
      size: blob.size
    });

    // Create File object
    const file = new File([blob], filename, {
      type: blob.type || 'video/mp4'
    });
    console.log('File created:', file);
    console.groupEnd();
    return file;
  } catch (error) {
    console.error('Video Fetch Error:', error);
    console.groupEnd();

    throw error;
  }
};

// Additional utility for validating video files
export const validateVideoFileAsync = async (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');

    video.onloadedmetadata = () => {
      // Additional checks
      const isValid = video.duration > 0 && video.duration < 3600; // Max 1 hour
      resolve(isValid);
    };

    video.onerror = () => {
      console.error('Video metadata load error');
      resolve(false);
    };

    video.src = URL.createObjectURL(file);
  });
};
