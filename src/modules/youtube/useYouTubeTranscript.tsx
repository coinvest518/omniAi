import * as React from 'react';

export interface YTVideoTranscript {
  title: string;
  transcript: string;
  thumbnailUrl: string;
}

export function useYouTubeTranscript(videoID: string | null, onNewTranscript: (transcript: YTVideoTranscript) => void) {
  const [transcript, setTranscript] = React.useState<YTVideoTranscript | null>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const [error, setError] = React.useState<unknown | null>(null);

  React.useEffect(() => {
    if (!videoID) {
      return;
    }

    const fetchData = async () => {
      setIsFetching(true);
      setIsError(false);
      setError(null);

      try {
        // Make a request to your API route
        const response = await fetch(`/api/youtubeTranscript?videoId=${videoID}`); 
        const data = await response.json();

        const newTranscript = {
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
  }, [videoID, onNewTranscript]);

  return {
    transcript,
    isFetching,
    isError,
    error,
  };
}
