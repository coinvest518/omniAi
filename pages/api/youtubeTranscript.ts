import type { NextApiRequest, NextApiResponse } from 'next';
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import { analyzeTranscript } from './analyzeTranscript';

// Define response type
type ResponseData = {
  success?: boolean;
  error?: string;
  data?: {
    videoTitle: string;
    thumbnailUrl: string;
    transcript: any;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    
    if (!body || !body.url) {
      return res.status(400).json({ error: 'Missing or invalid URL in request body' });
    }

    // Add additional validation for YouTube URL
    if (!ytdl.validateURL(body.url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Add retries for video info fetch
    let info;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        info = await ytdl.getInfo(body.url, {
          requestOptions: {
            headers: {
              // Add required headers
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
            }
          }
        });
        break;
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          throw new Error(`Failed to fetch video info after ${maxRetries} attempts`);
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!info) {
      throw new Error('Failed to fetch video information');
    }

    // Extract video details
    const videoTitle = info.videoDetails.title;
    const thumbnailUrl = info.videoDetails.thumbnails[0]?.url;

    // Locate English transcript with fallback options
    const tracks = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    let transcriptUrl = tracks?.find(track => track.languageCode === 'en')?.baseUrl;
    
    // If no English transcript, try auto-generated
    if (!transcriptUrl) {
      transcriptUrl = tracks?.find(track => track.languageCode === 'en-US' || track.kind === 'asr')?.baseUrl;
    }

    if (transcriptUrl) {
      const transcriptResponse = await fetch(transcriptUrl, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });

      if (!transcriptResponse.ok) {
        throw new Error(`Failed to fetch transcript: ${transcriptResponse.statusText}`);
      }

      const transcriptText = await transcriptResponse.text();
      const transcript = analyzeTranscript(transcriptText);

      return res.status(200).json({
        success: true,
        data: {
          videoTitle,
          thumbnailUrl,
          transcript
        }
      });
    } else {
      return res.status(404).json({ error: 'No English transcript available for this video' });
    }
  } catch (error) {
    console.error('API Error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Status code: 410')) {
        return res.status(410).json({ error: 'This video is no longer available' });
      }
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}