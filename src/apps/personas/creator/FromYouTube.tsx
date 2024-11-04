import * as React from 'react';
import type { SxProps } from '@mui/joy/styles/types';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { GoodTooltip } from '~/common/components/GoodTooltip';
import { Alert, Box, Button, Card, IconButton, Input, Typography } from '@mui/joy';
import { useYouTubeTranscript, YTVideoTranscript } from '~/modules/youtube/useYouTubeTranscript';

import type { SimplePersonaProvenance } from '../store-app-personas';

function extractVideoID(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/|youtube\.com\/shorts\/)([^#&?/]{11})/,
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([^#&?/]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

function YouTubeVideoTranscriptCard(props: { transcript: YTVideoTranscript, onClose: () => void, sx?: SxProps }) {
  const { transcript } = props;
  return (
    <Card
      variant='soft'
      sx={{
        border: '1px dashed',
        borderColor: 'neutral.solidBg',
        p: 1,
        ...props.sx,
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {!!transcript.thumbnailUrl && (
          <picture style={{ lineHeight: 0 }}>
            <img
              src={transcript.thumbnailUrl}
              alt='YouTube Video Thumbnail'
              height={80}
              style={{ float: 'left', marginRight: 8 }}
            />
          </picture>
        )}

        <Typography level='title-sm'>
          {transcript?.title}
        </Typography>
        <Typography level='body-xs' sx={{ mt: 0.75 }}>
          {transcript?.transcript ? transcript.transcript.slice(0, 280) + '...' : 'Loading transcript...'}
        </Typography>

        <IconButton
          size='sm'
          onClick={props.onClose}
          sx={{
            position: 'absolute', 
            top: -8, 
            right: -8,
            borderRadius: 'md',
          }}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>
    </Card>
  );
}

export function FromYouTube(props: {
  isTransforming: boolean;
  onCreate: (text: string, provenance: SimplePersonaProvenance) => void;
}) {
  // State
  const [url, setUrl] = React.useState('');
  const [videoID, setVideoID] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false); // Loading state
  const { onCreate } = props;

  // Handlers
  const onNewTranscript = React.useCallback((transcript: YTVideoTranscript) => {
    onCreate(
      transcript.transcript,
      {
        type: 'youtube',
        url: url,
        title: transcript.title,
        thumbnailUrl: transcript.thumbnailUrl,
      },
    );
  }, [onCreate, url]);

  const { transcript, isFetching, isError, error } = useYouTubeTranscript(videoID, onNewTranscript);

  const handleVideoURLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    setVideoID(null);
    setUrl(e.target.value);
  };

  const handleCreateFromTranscript = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); // Start loading state
    setLocalError(null);

    const videoId = extractVideoID(url);
    if (!videoId) {
      setLocalError('Please enter a valid YouTube URL');
      setLoading(false); // End loading state
      return;
    }

    setVideoID(videoId);
    setLoading(false); // End loading state
  };

  // Logging for debugging
  React.useEffect(() => {
    if (videoID) {
      console.log(`Fetching transcript for video ID: ${videoID}`);
    }
  }, [videoID]);

  React.useEffect(() => {
    if (isError) {
      console.error('Error fetching transcript:', error);
    }
  }, [isError, error]);

  return (
    <>
      <Typography level='title-md' startDecorator={<YouTubeIcon sx={{ color: '#f00' }} />} sx={{ mb: 3 }}>
        YouTube -&gt; Persona
      </Typography>

      <form onSubmit={handleCreateFromTranscript}>
        <Input
          required
          type='url'
          fullWidth
          disabled={isFetching || props.isTransforming || loading}
          variant='outlined'
          placeholder='YouTube Video URL'
          value={url}
          onChange={handleVideoURLChange}
          error={!!localError || isError}
          sx={{ mb: 1.5, backgroundColor: 'background.popup' }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type='submit'
            variant='solid'
            disabled={isFetching || props.isTransforming || !url || loading}
            loading={isFetching || loading}
            sx={{ minWidth: 140 }}
          >
            Create
          </Button>

          <GoodTooltip title='This example comes from the popular Fireship YouTube channel, which presents technical topics with irreverent humor.'>
            <Button 
              variant='outlined' 
              color='neutral' 
              onClick={() => setUrl('https://www.youtube.com/watch?v=M_wZpSEvOkc')}
            >
              Example
            </Button>
          </GoodTooltip>
        </Box>
      </form>

      {(localError || isError) && (
        <Alert color="danger" sx={{ mt: 3 }}> 
          {localError || (error instanceof Error ? error.message : 'Failed to fetch transcript')}
        </Alert>
      )}

      {!!transcript && !!videoID && (
        <YouTubeVideoTranscriptCard 
          transcript={transcript} 
          onClose={() => setVideoID(null)} 
          sx={{ mt: 3 }} 
        />
      )}
    </>
  );
}
