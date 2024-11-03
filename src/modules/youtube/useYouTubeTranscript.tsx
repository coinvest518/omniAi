import * as React from 'react';

export interface YTVideoTranscript {
  videoUrl: string;
  title: string;
  transcript: string;
  thumbnailUrl: string;
}

export function useYouTubeTranscript(
  videoUrl: string | null,
  onNewTranscript: (transcript: YTVideoTranscript) => void
) {
  const [transcript, setTranscript] = React.useState<YTVideoTranscript | null>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const [error, setError] = React.useState<unknown | null>(null);

  React.useEffect(() => {
    if (!videoUrl) return;

    const fetchData = async () => {
      setIsFetching(true);
      setIsError(false);
      setError(null);

      try {
        const response = await fetch('/api/youtubeTranscript', { // No query parameter
          method: 'POST', // Use POST request
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoUrl }), // Send videoUrl in the body
        });
        const data = await response.json();

        const newTranscript = {
          videoUrl: data.videoUrl,
          title: data.videoTitle,
          transcript: data.transcript,
          thumbnailUrl: data.thumbnailUrl,
        };
        setTranscript(newTranscript);
        onNewTranscript(newTranscript);
      } catch (err) {
        setIsError(true);
        setError(err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [videoUrl, onNewTranscript]);

  return { transcript, isFetching, isError, error };
}