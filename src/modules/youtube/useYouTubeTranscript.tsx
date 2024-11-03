import * as React from 'react';

export interface YTVideoTranscript {
  url: string;
  title: string;
  transcript: string;
  thumbnailUrl: string;
}

export function useYouTubeTranscript(
  url: string | null,
  onNewTranscript: (transcript: YTVideoTranscript) => void
) {
  const [transcript, setTranscript] = React.useState<YTVideoTranscript | null>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const [error, setError] = React.useState<unknown | null>(null);

  React.useEffect(() => {
    if (!url) return;

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
          body: JSON.stringify({ url }), // Send videoUrl in the body
        });
        const data = await response.json();

        const newTranscript = {
          url: data.url,
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
  }, [url, onNewTranscript]);

  return { transcript, isFetching, isError, error };
}