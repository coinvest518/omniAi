// pages/api/youtubeTranscript.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import ytdl from 'ytdl-core';
import { analyzeTranscript, CharacterAnalysis } from './analyzeTranscript'; // Import your analyzeTranscript function

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { url } = req.body; // Get the URL from the request body

    try {
      // Validate URL
      if (!url || !ytdl.validateURL(url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
      }

      // Fetch the video information using ytdl-core
      const info = await ytdl.getBasicInfo(url);
      
      // Check if captions exist
      const captions = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!captions || captions.length === 0) {
        return res.status(404).json({ error: 'No transcript available for this video.' });
      }

      // Fetch the actual transcript text from the first track
      const transcriptUrl = captions[0].baseUrl; // Assuming we want the first caption track
      const transcriptResponse = await fetch(transcriptUrl);
      const transcriptData = await transcriptResponse.text();

      // Call the analyzeTranscript function and get the analysis
      const analyzedData: CharacterAnalysis = analyzeTranscript(transcriptData);

      // Respond with the analysis data
      return res.status(200).json({
        videoTitle: info.videoDetails.title, // Use the actual video title
        transcript: analyzedData, // Include the analyzed data in the response
        thumbnailUrl: info.videoDetails.thumbnails[0].url, // Use the actual thumbnail URL
      });
    } catch (error) {
      console.error("Error fetching or analyzing transcript:", error);
      return res.status(500).json({ error: "Failed to process the transcript" });
    }
  } else {
    // Handle any other HTTP method
    return res.setHeader('Allow', ['POST']).status(405).end(`Method ${req.method} Not Allowed`);
  }
}
