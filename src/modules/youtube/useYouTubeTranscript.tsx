import * as React from 'react';
import { useEffect, useState } from 'react';


export interface YTVideoTranscript {
  videoID: string;
  title: string;
  transcript: string;
  thumbnailUrl: string;
}

export function useYouTubeTranscript(
  videoID: string | null,
  onNewTranscript: (transcript: YTVideoTranscript) => void
) {
  const [transcript, setTranscript] = React.useState<YTVideoTranscript | null>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const [error, setError] = React.useState<unknown | null>(null);

  React.useEffect(() => {
    if (!videoID) return;

    const fetchData = async () => {
      setIsFetching(true);
      setIsError(false);
      setError(null);

      try {
        const response = await fetch('/api/youtubeTranscript', { // Update path here
          method: 'POST', // Use POST request
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoID}` }),
        });
        const data = await response.json();

        const newTranscript = {
          videoID: data.videoID,
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

  return { transcript, isFetching, isError, error };
}