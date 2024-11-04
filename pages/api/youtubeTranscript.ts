// Import required modules
import { NextResponse } from 'next/server';
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import { analyzeTranscript } from './analyzeTranscript';

export async function POST(req: Request) {
  try {
    const body = await req.json(); // Ensure this is correct
    if (!body?.url) {
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

    // Find English transcript
    const tracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (tracks) {
      const transcriptUrl = tracks.find(track => track.languageCode === 'en')?.baseUrl;

      if (transcriptUrl) { 
        const transcriptResponse = await fetch(transcriptUrl);
        console.log('Transcript response headers:', transcriptResponse.headers);
        if (!transcriptResponse.ok) {
          console.error('Error fetching transcript:', transcriptResponse.statusText);
          throw new Error(`Failed to fetch transcript: ${transcriptResponse.statusText}`);
        }

        let transcriptText = await transcriptResponse.text();

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
      } else {
        // Handle the case where 'transcriptUrl' is undefined
        return NextResponse.json(
          { error: 'No English transcript available for this video' },
          { status: 404 }
        );
      }
    } else {
      // Handle the case where 'tracks' is undefined
      return NextResponse.json(
        { error: 'No English transcript available for this video' },
        { status: 404 }
      );
    }
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

    // Generic fallback for unexpected errors
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Add this default export to the file
export default function handler(req: Request, res: Response) {
  if (req.method === 'POST') {
    return POST(req);
  } else {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
}
