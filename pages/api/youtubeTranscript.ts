import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

// Define the structure of the expected response from the Render API
type RenderApiResponse = {
  videoTitle: string;
  thumbnailUrl: string;
  transcript: string; // Assuming transcript is a string
};

// Define response type for your API
type ResponseData = {
  success?: boolean;
  error?: string;
  data?: {
    videoTitle: string;
    thumbnailUrl: string;
    transcript: any; // You can define this type further if needed
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

    // Validate the incoming request body
    if (!body || !body.url) {
      return res.status(400).json({ error: 'Missing or invalid URL in request body' });
    }

    // Replace with your Render API endpoint
    const renderApiUrl = 'https://youtubeserver-pzcp.onrender.com/api/transcribe';

    // Forward request to the Render API to get the transcript
    const renderResponse = await fetch(renderApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: body.url }),
    });

    // Check if the Render API responded with an error
    if (!renderResponse.ok) {
      const errorData = await renderResponse.json().catch(() => ({})); // Handle non-JSON responses gracefully
      return res.status(renderResponse.status).json({
        error: (errorData as { error?: string }).error || 'Failed to fetch transcript from Render API',
      });
    }

    // Parse the successful response from the Render API
    const data = (await renderResponse.json()) as RenderApiResponse;

    if (!data || !data.transcript) {
      return res.status(404).json({ error: 'No transcript available' });
    }

    return res.status(200).json({
      success: true,
      data: {
        videoTitle: data.videoTitle,
        thumbnailUrl: data.thumbnailUrl,
        transcript: data.transcript, // This should be the analyzed transcript
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
