import { NextApiRequest, NextApiResponse } from 'next';
import ytdl from 'ytdl-core';
import { analyzeTranscript } from './analyzeTranscript';
import { AssemblyAI } from 'assemblyai';
import { Readable } from 'stream';


const apiKey = process.env.ASSEMBLYAI_API_KEY;
if (!apiKey) {
  throw new Error('API key is not set in the environment variables');
}

const client = new AssemblyAI({ apiKey });

async function downloadAudio(videoUrl: string): Promise<Readable> {
  return ytdl(videoUrl, { filter: 'audioonly' });
}

async function transcribeAudio(audio: Readable): Promise<string | null | undefined> {
  const transcript = await client.transcripts.transcribe({
    audio,
    speaker_labels: true,
  });

  return transcript.text;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (!body?.url) {
        return res.status(400).json({ error: 'Missing or invalid URL in request body' });
      }

      if (!ytdl.validateURL(body.url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
      }

      const info = await ytdl.getInfo(body.url).catch((error) => {
        console.error('Failed to fetch video info:', error);
        throw new Error('Failed to fetch video information');
      });

      if (!info) {
        return res.status(400).json({ error: 'Failed to fetch video information' });
      }

      const videoTitle = info.videoDetails.title;
      const thumbnailUrl = info.videoDetails.thumbnails[0]?.url;

      const audioStream = await downloadAudio(body.url);
      const transcriptText = await transcribeAudio(audioStream);

      if (typeof transcriptText !== 'string') {
        throw new Error('Transcription failed or returned an invalid result');
      }

      const transcript = analyzeTranscript(transcriptText);

      return res.status(200).json({
        success: true,
        data: {
          videoTitle,
          thumbnailUrl,
          transcript,
        },
      });
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof Error && error.message.includes('ytdl')) {
        return res.status(500).json({ error: 'Failed to process YouTube video' });
      } else if (error instanceof Error && error.message.includes('fetch')) {
        return res.status(503).json({ error: 'Failed to fetch transcript' });
      } else if (error instanceof Error && error.message.includes('AssemblyAI')) {
        return res.status(500).json({ error: 'Failed to transcribe audio with AssemblyAI' });
      }

      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}