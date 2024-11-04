import { NextApiRequest, NextApiResponse } from 'next';
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import { analyzeTranscript } from './analyzeTranscript';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body; // Extract video URL from request body

  if (!url) {
    return res.status(400).json({ error: 'Video URL is required' });
  }

  try {
    const info = await ytdl.getInfo(url);
    console.log('Video info:', info); // Log video information for debugging

    const videoTitle = info.videoDetails.title;
    const thumbnailUrl = info.videoDetails.thumbnails[0].url;

    const captionTracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    const transcriptUrl = captionTracks?.find(track => track.languageCode === 'en')?.baseUrl;

    if (!transcriptUrl) {
      return res.status(400).json({ error: 'No transcript available' });
    }

    console.log('Transcript URL:', transcriptUrl); // Log transcript URL

    const captionsResponse = await fetch(transcriptUrl);
    if (!captionsResponse.ok) {
      throw new Error('Failed to fetch captions');
    }

    const captionsText = await captionsResponse.text();
    const transcript = analyzeTranscript(captionsText);

    return res.status(200).json({ videoTitle, thumbnailUrl, transcript });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error processing video:', errorMessage); // Log the error
    return res.status(500).json({ error: `Failed to process video: ${errorMessage}` });
  }
}