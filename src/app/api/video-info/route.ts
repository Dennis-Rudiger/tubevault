import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Basic URL validation for YouTube
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/;
    if (!youtubeRegex.test(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Validate that it's a valid YouTube URL for ytdl-core
    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: 'Invalid or unsupported YouTube URL' },
        { status: 400 }
      );
    }

    // Get video info using ytdl-core
    console.log('Fetching video info for:', url);
    const info = await ytdl.getInfo(url);
    
    const videoDetails = info.videoDetails;
    const formats = info.formats;

    // Process formats to separate video and audio-only
    const videoFormats = formats.filter(format => 
      format.hasVideo && format.hasAudio && format.container === 'mp4'
    ).map(format => ({
      format_id: format.itag?.toString(),
      ext: format.container,
      filesize: format.contentLength ? parseInt(format.contentLength) : undefined,
      height: format.height,
      width: format.width,
      quality: format.qualityLabel,
      hasVideo: format.hasVideo,
      hasAudio: format.hasAudio
    }));

    const audioFormats = formats.filter(format => 
      !format.hasVideo && format.hasAudio
    ).map(format => ({
      format_id: format.itag?.toString(),
      ext: format.container,
      filesize: format.contentLength ? parseInt(format.contentLength) : undefined,
      quality: format.audioBitrate ? `${format.audioBitrate}kbps` : undefined,
      hasVideo: format.hasVideo,
      hasAudio: format.hasAudio
    }));

    // Extract relevant information
    const result = {
      title: videoDetails.title || 'Unknown Title',
      description: videoDetails.description || '',
      thumbnail: videoDetails.thumbnails?.[videoDetails.thumbnails.length - 1]?.url || '',
      uploader: videoDetails.author?.name || videoDetails.ownerChannelName || 'Unknown',
      duration: parseInt(videoDetails.lengthSeconds || '0'),
      viewCount: parseInt(videoDetails.viewCount || '0'),
      uploadDate: videoDetails.uploadDate || '',
      formats: {
        video: videoFormats,
        audioOnly: audioFormats,
      }
    };

    console.log('Successfully fetched video info:', result.title);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching video info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video information. Please check the URL and try again.' },
      { status: 500 }
    );
  }
}
