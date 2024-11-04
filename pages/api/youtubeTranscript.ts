import { NextResponse } from 'next/server';
import ytdl from 'ytdl-core';
import { analyzeTranscript } from './analyzeTranscript';
import { AssemblyAI } from 'assemblyai';
import { Readable } from 'stream';

const client = new AssemblyAI({
  apiKey: 'dcf3ac04cf8a404d8554a56bbe32fde6'
});

async function downloadAudio(videoUrl: string): Promise<Readable> {
  return ytdl(videoUrl, { filter: 'audioonly' });
}

async function transcribeAudio(audio: Readable): Promise<string | null | undefined> {
  const transcript = await client.transcripts.transcribe({
    audio,
    speaker_labels: true
  });

  return transcript.text;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
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

    // Download audio
    const audioStream: Readable = await downloadAudio(body.url);

    // Transcribe audio with AssemblyAI
    const transcriptText: string | null | undefined = await transcribeAudio(audioStream);

    // Check if transcriptText is a string
    if (typeof transcriptText !== 'string') {
      throw new Error('Transcription failed or returned an invalid result');
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

    const isYTDLError = error instanceof Error && error.message.includes('ytdl');
    const isFetchError = error instanceof Error && error.message.includes('fetch');
    const isAssemblyAIError = error instanceof Error && error.message.includes('AssemblyAI');

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
    } else if (isAssemblyAIError) {
      return NextResponse.json(
        { error: 'Failed to transcribe audio with AssemblyAI' },
        { status: 500 }
      );
    }

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