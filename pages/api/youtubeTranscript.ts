import { NextApiRequest, NextApiResponse } from 'next';
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import { analyzeTranscript } from './analyzeTranscript'; // Import the analysis function

type CaptionEvent = { segs?: { utf8: string }[] };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { videoUrl } = req.query;

  const videoUrlString = Array.isArray(videoUrl) ? videoUrl[0] : videoUrl;

  if (!videoUrlString) {
    return res.status(400).json({ error: 'Video URL is required' });
  }

  try {
    const info = await ytdl.getInfo(videoUrlString);
    const videoTitle = info.videoDetails.title;
    const thumbnailUrl = info.videoDetails.thumbnails[0].url;

    // Retrieve caption tracks directly
    const captionTracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    const transcriptUrl = captionTracks?.find(track => track.languageCode === 'en')?.baseUrl;

    if (!transcriptUrl) {
      return res.status(400).json({ error: 'No transcript available for this video' });
    }

    // Fetch and process transcript from the transcript URL
    const captionsResponse = await fetch(transcriptUrl);
    const captionsJson = await captionsResponse.json();

    const transcript = (captionsJson.events as CaptionEvent[])
      .flatMap(event => event.segs ?? [])
      .map(seg => seg.utf8)
      .join('');

    // Analyze the transcript
    const characterAnalysis = analyzeTranscript(transcript);

    return res.status(200).json({
      videoUrl: videoUrlString,
      videoTitle,
      thumbnailUrl,
      transcript,
      characterAnalysis,
    });
  } catch (error) {
    return res.status(500).json({ error: `Failed to process video: ${(error as Error).message}` });
  }
}
