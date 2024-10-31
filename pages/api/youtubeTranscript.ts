import { NextApiRequest, NextApiResponse } from 'next';
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import { analyzeTranscript } from './analyzeTranscript'; // Import the analysis function

type CaptionEvent = { segs?: { utf8: string }[] };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { videoUrl } = req.query; // Expecting videoUrl instead of videoId

  const videoUrlString = Array.isArray(videoUrl) ? videoUrl[0] : videoUrl;

  if (!videoUrlString) {
    return res.status(400).json({ error: 'Video URL is required' });
  }

  try {
    const info = await ytdl.getInfo(videoUrlString); // Use videoUrlString here
    const videoTitle = info.videoDetails.title;
    const thumbnailUrl = info.videoDetails.thumbnails[0].url;

    const captions = info.player_response.captions;

    let transcript = '';

    if (captions && captions.playerCaptionsTracklistRenderer) {
      const tracks = captions.playerCaptionsTracklistRenderer.captionTracks;
      const englishTrack = tracks.find(track => track.languageCode === 'en');
      if (englishTrack) {
        const captionsUrl = englishTrack.baseUrl;
        const captionsResponse = await fetch(captionsUrl);
        const captionsJson = await captionsResponse.json();

        transcript = (captionsJson.events as CaptionEvent[])
          .flatMap(event => event.segs ?? [])
          .map(seg => seg.utf8)
          .join('');
      }
    }

    // Analyze the transcript
    const characterAnalysis = analyzeTranscript(transcript);

    return res.status(200).json({
      videoUrl: videoUrlString, // Return the videoUrl
      videoTitle,
      thumbnailUrl,
      transcript,
      characterAnalysis,
    });
  } catch (error) {
    return res.status(500).json({ error: `Failed to process video: ${(error as Error).message}` });
  }
}
