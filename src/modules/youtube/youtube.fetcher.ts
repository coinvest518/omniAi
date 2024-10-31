import { z } from 'zod';
import Bottleneck from 'bottleneck';
import puppeteer from 'puppeteer';

const youtubeTranscriptionSchema = z.object({
  wireMagic: z.literal('pb3'),
  events: z.array(
    z.object({
      tStartMs: z.number(),
      dDurationMs: z.number().optional(),
      aAppend: z.number().optional(),
      segs: z.array(
        z.object({
          utf8: z.string(),
          tOffsetMs: z.number().optional(),
        }),
      ).optional(),
    }),
  ),
});

function extractFromTo(html: string, from: string, to: string, label: string): string {
  const indexStart = html.indexOf(from);
  const indexEnd = html.indexOf(to, indexStart);
  if (indexStart < 0 || indexEnd <= indexStart)
    throw new Error(`[YouTube API Issue] Could not find '${label}'`);
  return html.substring(indexStart, indexEnd);
}

interface YouTubeTranscriptData {
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  transcript: string;
}

const limiter = new Bottleneck({
  maxConcurrent: 1, // Adjust as needed
  minTime: 1000, // 1 second delay between requests
});

async function fetchTextWithPuppeteer(url: string): Promise<string> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  const content = await page.content();
  await browser.close();
  return content;
}

export async function fetchYouTubeTranscript(videoId: string): Promise<YouTubeTranscriptData> {
  return limiter.schedule(async () => {
    // 1. find the captions URL within the video HTML page
    const html = await fetchTextWithPuppeteer(`https://www.youtube.com/watch?v=${videoId}`);

    const captionsUrlEnc = extractFromTo(html, 'https://www.youtube.com/api/timedtext', '"', 'Captions URL');
    const captionsUrl = decodeURIComponent(captionsUrlEnc.replaceAll('\\u0026', '&'));
    const thumbnailUrl = extractFromTo(html, 'https://i.ytimg.com/vi/', '"', 'Thumbnail URL').replaceAll('maxres', 'hq');
    const videoTitle = extractFromTo(html, '<title>', '</title>', 'Video Title').slice(7).replaceAll(' - YouTube', '').trim();

    // 2. fetch the captions
    const captions = await fetchTextWithPuppeteer(captionsUrl + `&fmt=json3`);

    let captionsJson: any;
    try {
      captionsJson = JSON.parse(captions);
    } catch (e) {
      console.error(e);
      throw new Error('[YouTube API Issue] Could not parse the captions');
    }
    const safeData = youtubeTranscriptionSchema.safeParse(captionsJson);
    if (!safeData.success) {
      console.error(safeData.error);
      throw new Error('[YouTube API Issue] Could not verify the captions');
    }

    // 3. flatten to text
    const transcript = safeData.data.events
      .flatMap(event => event.segs ?? [])
      .map(seg => seg.utf8)
      .join('');

    return {
      videoId,
      videoTitle,
      thumbnailUrl,
      transcript,
    };
  });
}