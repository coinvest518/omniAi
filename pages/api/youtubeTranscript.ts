import { NextResponse } from 'next/server';
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import { analyzeTranscript } from './analyzeTranscript';

export default async function handler(req: Request) {
  const { url } = await req.json();

  try {
    if (req.method !== 'POST') {
      return new NextResponse('Method not allowed', { status: 405 });
    }
    const info = await ytdl.getInfo(url);
    console.log('Video info:', info); // Log video information for debugging
    const videoTitle = info.videoDetails.title;
    const thumbnailUrl = info.videoDetails.thumbnails[0].url;
    const captionTracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    const transcriptUrl = captionTracks?.find(track => track.languageCode === 'en')?.baseUrl;
    if (!transcriptUrl) {
      return new NextResponse('No transcript available', { status: 400 });
    }
    console.log('Transcript URL:', transcriptUrl); // Log transcript URL
    const captionsResponse = await fetch(transcriptUrl);
    if (!captionsResponse.ok) {
      throw new Error('Failed to fetch captions');
    }
    const captionsText = await captionsResponse.text();
    const transcript = analyzeTranscript(captionsText);
    return new NextResponse(JSON.stringify({ videoTitle, thumbnailUrl, transcript }), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error processing video:', errorMessage); // Log the error
    return new NextResponse(`Failed to process video: ${errorMessage}`, { status: 500 });
  }
}

