import { NextResponse } from 'next/server';
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import { analyzeTranscript } from './analyzeTranscript';

export async function POST(req: Request) {
  try {
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body?.url) {
      return NextResponse.json(
        { error: 'Missing or invalid URL in request body' },
        { status: 400 }
      );
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(body.url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Fetch video information
    const info = await ytdl.getInfo(body.url).catch((error) => {
      console.error('Failed to fetch video info:', error);
      throw new Error('Failed to fetch video information');
    });

    // Extract video details
    const videoTitle = info.videoDetails.title;
    const thumbnailUrl = info.videoDetails.thumbnails[0]?.url;
    const captionTracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    // Find English transcript
    const transcriptTrack = captionTracks?.find(
      (track: any) => track.languageCode === 'en'
    );

    if (!transcriptTrack?.baseUrl) {
      return NextResponse.json(
        { error: 'No English transcript available for this video' },
        { status: 404 }
      );
    }

    // Fetch transcript
    const transcriptResponse = await fetch(transcriptTrack.baseUrl);
    console.log('Transcript response headers:', transcriptResponse.headers); // Log headers
    if (!transcriptResponse.ok) {
      console.error('Error fetching transcript:', transcriptResponse.statusText);
      throw new Error(`Failed to fetch transcript: ${transcriptResponse.statusText}`);
    }

    const transcriptText = await transcriptResponse.text();
    if (!transcriptText) {
      throw new Error('Empty transcript received');
    }

    // Process transcript
    const transcript = analyzeTranscript(transcriptText);

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        videoTitle,
        thumbnailUrl,
        transcript
      }
    });

  } catch (error) {
    console.error('API Error:', error);

    // Determine if error is a known type
    const isYTDLError = error instanceof Error && error.message.includes('ytdl');
    const isFetchError = error instanceof Error && error.message.includes('fetch');

    if (isYTDLError) {
      return NextResponse.json(
        { error: 'Failed to process YouTube video' },
        { status: 500 }
      );
    } else if (isFetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch transcript' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}