import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { frontendSideFetch } from '~/common/util/clientFetchers';
import { fetchYouTubeTranscript } from './youtube.fetcher';
import { apiAsync } from '~/common/util/trpc.client';

// Define the API response type
interface YouTubeTranscriptResponse {
  videoTitle: string;
  transcript: string;
  thumbnailUrl: string;
}

export interface YTVideoTranscript {
  title: string;
  transcript: string;
  thumbnailUrl: string;
}

// configuration
const USE_FRONTEND_FETCH = false;

export function useYouTubeTranscript(
  videoID: string | null, 
  onNewTranscript: (transcript: YTVideoTranscript) => void
) {
  // state
  const [transcript, setTranscript] = React.useState<YTVideoTranscript | null>(null);

  // data
  const { data, isFetching, isError, error } = useQuery<YouTubeTranscriptResponse>({
    enabled: !!videoID,
    queryKey: ['transcript', videoID],
    queryFn: async () => {
      if (!videoID) throw new Error('No video ID provided');
      
      if (USE_FRONTEND_FETCH) {
        return fetchYouTubeTranscript(videoID, url => 
          frontendSideFetch(url).then(res => res.text())
        ) as Promise<YouTubeTranscriptResponse>;
      }
      
      return apiAsync.youtube.getTranscript.query({ 
        videoId: videoID 
      }) as Promise<YouTubeTranscriptResponse>;
    },
    staleTime: Infinity,
  });

  // update the transcript when the underlying data changes
  React.useEffect(() => {
    if (!data) {
      return;
    }
    const transcript: YTVideoTranscript = {
      title: data.videoTitle,
      transcript: data.transcript,
      thumbnailUrl: data.thumbnailUrl,
    };
    setTranscript(transcript);
    onNewTranscript(transcript);
  }, [data, onNewTranscript]);

  return {
    transcript,
    isFetching,
    isError,
    error,
  };
}