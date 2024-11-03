import { NextResponse } from 'next/server';
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import { analyzeTranscript } from './analyzeTranscript';

export async function POST(req: Request) {
  const { url } = await req.json(); // Get video URL from the request body

  if (!url) {
    return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
  }

  try {
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title;
    const thumbnailUrl = info.videoDetails.thumbnails[0].url;

    const captionTracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    const transcriptUrl = captionTracks?.find(track => track.languageCode === 'en')?.baseUrl;

    if (!transcriptUrl) {
      return NextResponse.json({ error: 'No transcript available for this video' }, { status: 400 });
    }

    const captionsResponse = await fetch(transcriptUrl);
    const captionsText = await captionsResponse.text();

    // Process the transcript using your own analysis function
    const transcript = analyzeTranscript(captionsText); 

    return NextResponse.json({ videoTitle, thumbnailUrl, transcript });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to process video: ${errorMessage}` }, { status: 500 });
  }
}


