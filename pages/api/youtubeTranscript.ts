import type { NextApiRequest, NextApiResponse } from 'next';
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import { analyzeTranscript } from './analyzeTranscript';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { videoUrl } = req.body;

  if (!videoUrl) return res.status(400).json({ error: 'Video URL is required' })

  try {
    const info = await ytdl.getInfo(videoUrl as string);
    const videoTitle = info.videoDetails.title;
    const thumbnailUrl = info.videoDetails.thumbnails[0].url;

    const captionTracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    const transcriptUrl = captionTracks?.find(track => track.languageCode === 'en')?.baseUrl;

    if (!transcriptUrl) return res.status(400).json({ error: 'No transcript available' })

    const captionsResponse = await fetch(transcriptUrl);
    const captionsText = await captionsResponse.text();

    const transcript = analyzeTranscript(captionsText);
    res.status(200).json({ videoTitle, thumbnailUrl, transcript });
  } catch (error) {
    // Cast `error` to an instance of `Error` to safely access `error.message`
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: `Failed to process video: ${errorMessage}` });
  }
}
