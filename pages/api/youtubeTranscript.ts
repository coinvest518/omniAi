import { NextApiRequest, NextApiResponse } from 'next';
import ytdl from 'ytdl-core';
import { analyzeTranscript, CharacterAnalysis } from './analyzeTranscript';

export interface YTVideoTranscript {
  title: string;
  transcript: string;
  thumbnailUrl?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  try {
    // Fetch video info from YouTube
    const videoInfo = await ytdl.getInfo(url);
    const captions = videoInfo.player_response.captions;

    if (!captions || !captions.playerCaptionsTracklistRenderer) {
      throw new Error('No captions found for this video.');
    }

    const transcriptUrl = captions.playerCaptionsTracklistRenderer.captionTracks[0]?.baseUrl;

    if (!transcriptUrl) {
      throw new Error('Transcript URL not found.');
    }

    const transcriptResponse = await fetch(transcriptUrl);
    const transcriptData = await transcriptResponse.text(); // Assuming transcript is in text format

    console.log("Transcript Data:", transcriptData); // Log transcript data for debugging

    // Analyze the transcript
    const characterAnalysis: CharacterAnalysis = analyzeTranscript(transcriptData);

    return res.status(200).json({ 
      title: videoInfo.videoDetails.title,
      transcript: transcriptData,
      thumbnailUrl: videoInfo.videoDetails.thumbnails[0]?.url,
      analysis: characterAnalysis
    });

  } catch (error) {
    console.error("Error fetching or analyzing transcript:", error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to process the transcript" });
  }
}
