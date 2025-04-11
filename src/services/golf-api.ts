import axios from 'axios';

// Configure base URL
const API_URL =
  import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5012/api';
const BASE_URL = import.meta.env?.VITE_BASE_URL || 'http://localhost:5012';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000 // Increase timeout to 60 seconds for large uploads
});

// Add request/response interceptors for better debugging
apiClient.interceptors.request.use((request) => {
  console.log('Starting Request', {
    url: request.url,
    method: request.method,
    data:
      request.data instanceof FormData
        ? 'FormData (not displayed)'
        : request.data
  });
  return request;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log('Response received', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

const golfApi = {
  /**
   * Upload a single video file
   */
  uploadVideo: async (file: File, golferId: string = 'unknown') => {
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('golferId', golferId);

      console.log('Upload request details:', {
        url: '/upload',
        file: {
          name: file.name,
          size: file.size,
          type: file.type
        },
        golferId
      });

      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Upload Axios Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        throw new Error(
          error.response?.data?.error ||
            error.response?.statusText ||
            'Failed to upload video'
        );
      } else {
        console.error('Unexpected upload error:', error);
        throw error;
      }
    }
  },

  /**
   * Batch upload multiple video files for training
   */
  batchTrainingUpload: async (files: File[], golferId: string) => {
    try {
      const formData = new FormData();

      // Add all files to formData
      files.forEach((file) => {
        formData.append('videos', file);
      });

      formData.append('golferId', golferId);

      console.log(
        `Batch upload request: ${files.length} files for golfer ${golferId}`
      );

      // Make sure we're using the correct endpoint
      const response = await apiClient.post(
        '/batch-training-upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          // Add progress tracking for large uploads
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      );

      console.log('Batch upload response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Batch Upload Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        throw new Error(
          error.response?.data?.error ||
            error.response?.statusText ||
            'Failed to upload training videos'
        );
      } else {
        console.error('Unexpected batch upload error:', error);
        throw error;
      }
    }
  },

  /**
   * Process a training session
   */
  processTrainingSession: async (sessionId: string) => {
    try {
      const response = await apiClient.post(
        `/process-training-session/${sessionId}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Process Training Session Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        throw new Error(
          error.response?.data?.error ||
            error.response?.statusText ||
            'Failed to process training session'
        );
      }
      throw error;
    }
  },

  /**
   * Verify if a swing belongs to a specific golfer
   */
  verifyGolfer: async (cropId: string, golferId: string) => {
    try {
      const response = await apiClient.post(
        '/verify-golfer',
        {
          crop_id: cropId,
          golfer_id: golferId
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Verify Golfer Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        throw new Error(
          error.response?.data?.error ||
            error.response?.statusText ||
            'Failed to verify golfer'
        );
      }
      throw error;
    }
  },

  /**
   * Analyze a video to extract key frames
   */
  analyzeVideo: async (uploadId: string) => {
    try {
      const response = await apiClient.post(`/analyze/${uploadId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Analyze Video Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        throw new Error(
          error.response?.data?.error ||
            error.response?.statusText ||
            'Failed to analyze video'
        );
      }
      throw error;
    }
  },

  /**
   * Crop a video based on key frames
   */
  cropVideo: async ({
    uploadId,
    startFrame,
    endFrame,
    golferId = 'unknown'
  }: {
    uploadId: string;
    startFrame: number;
    endFrame: number;
    golferId?: string;
  }) => {
    try {
      const response = await apiClient.post(
        '/crop',
        {
          upload_id: uploadId,
          start_frame: startFrame,
          end_frame: endFrame,
          golfer_id: golferId
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Crop Video Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        throw new Error(
          error.response?.data?.error ||
            error.response?.statusText ||
            'Failed to crop video'
        );
      }
      throw error;
    }
  }
};

export default golfApi;
