import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import { analyzeTranscript } from './analyzeTranscript';

// Specify Node.js runtime
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Parse JSON safely
    const body = await req.json().catch(() => null);
    if (!body || !body.url) {
      return NextResponse.json(
        { error: 'Missing or invalid URL in request body' },
        { status: 400 }
      );
    }

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

    // Locate English transcript
    const tracks = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    const transcriptUrl = tracks?.find(track => track.languageCode === 'en')?.baseUrl;

    if (transcriptUrl) {
      const transcriptResponse = await fetch(transcriptUrl);
      if (!transcriptResponse.ok) {
        throw new Error(`Failed to fetch transcript: ${transcriptResponse.statusText}`);
      }

      const transcriptText = await transcriptResponse.text();
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
    } else {
      return NextResponse.json(
        { error: 'No English transcript available for this video' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}