import { z } from 'zod';
import ytdl from 'ytdl-core';

const youtubeTranscriptionSchema = z.object({
  wireMagic: z.literal('pb3'),
  events: z.array(
    z.object({
      tStartMs: z.number(),
      dDurationMs: z.number().optional(),
      aAppend: z.number().optional(),
      segs: z.array(
        z.object({
          utf8: z.string(),
          tOffsetMs: z.number().optional(),
        }),
      ).optional(),
    }),
  ),
});

interface YouTubeTranscriptData {
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  transcript: string;
}

// Define the structure of the captions JSON
interface CaptionSegment {
  utf8: string;
  tOffsetMs?: number;
}

interface CaptionEvent {
  segs?: CaptionSegment[];
}

export async function fetchYouTubeTranscript(videoId: string): Promise<YouTubeTranscriptData> {
  const info = await ytdl.getInfo(videoId);
  const videoTitle = info.videoDetails.title;
  const thumbnailUrl = info.videoDetails.thumbnails[0].url;

  // Fetch captions (if available)
  const captions = info.player_response.captions;
  let transcript = '';

  if (captions && captions.playerCaptionsTracklistRenderer) {
    const tracks = captions.playerCaptionsTracklistRenderer.captionTracks;
    const englishTrack = tracks.find(track => track.languageCode === 'en'); // or any other language you prefer
    if (englishTrack) {
      const captionsUrl = englishTrack.baseUrl;
      const captionsResponse = await fetch(captionsUrl);
      const captionsJson = await captionsResponse.json();

      // Process captionsJson to extract the transcript
      transcript = (captionsJson.events as CaptionEvent[]) // Cast to CaptionEvent[]
        .flatMap(event => event.segs ?? []) // Now event is of type CaptionEvent
        .map(seg => seg.utf8) // Now seg is of type CaptionSegment
        .join('');
    }
  }

  return {
    videoId,
    videoTitle,
    thumbnailUrl,
    transcript,
  };
}