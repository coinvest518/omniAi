import { useState, useEffect, useCallback } from 'react';

export interface YTVideoTranscript {
  title: string;
  transcript: string;
  thumbnailUrl?: string;
}

export function useYouTubeTranscript(
  videoId: string | null,
  onSuccess?: (transcript: YTVideoTranscript) => void,
) {
  const [transcript, setTranscript] = useState<YTVideoTranscript | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTranscript = useCallback(async (videoId: string) => {
    if (!videoId) return;
    
    setIsFetching(true);
    setIsError(false);
    setError(null);

    try {
      const response = await fetch('/api/youtubeTranscript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transcript');
      }

      const data = await response.json();
      
      // Validate response data
      if (!data?.data?.transcript) {
        throw new Error('Invalid transcript data received');
      }

      const transcriptData: YTVideoTranscript = {
        title: data.data.videoTitle,
        transcript: data.data.transcript,
        thumbnailUrl: data.data.thumbnailUrl,
      };

      setTranscript(transcriptData);
      onSuccess?.(transcriptData);

    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsFetching(false);
    }
  }, [onSuccess]);

  useEffect(() => {
    if (videoId) {
      fetchTranscript(videoId);
    } else {
      setTranscript(null);
      setIsError(false);
      setError(null);
    }
  }, [videoId, fetchTranscript]);

  return {
    transcript,
    isFetching,
    isError,
    error,
  };
}