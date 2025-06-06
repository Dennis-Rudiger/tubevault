import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';
import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

function extractVideoId(url: string): string | null {
  const regexes = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)/,
    /(?:https?:\/\/)?youtu\.be\/([^?\s]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?\s]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^?\s]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?\s]+)/,
  ];
  for (const regex of regexes) {
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  const videoId = extractVideoId(url);

  if (!videoId) {
    return NextResponse.json(
      { error: 'Invalid YouTube URL or unable to extract Video ID' },
      { status: 400 }
    );
  }

  try {
    console.log('Fetching video info for Video ID:', videoId);

    // 1. Fetch metadata from YouTube Data API
    const apiResponse = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: [videoId],
    });

    if (!apiResponse.data.items || apiResponse.data.items.length === 0) {
      return NextResponse.json(
        { error: 'Video not found or access denied by YouTube API.' },
        { status: 404 }
      );
    }

    const videoData = apiResponse.data.items[0];
    const snippet = videoData.snippet;
    const contentDetails = videoData.contentDetails;
    const statistics = videoData.statistics;

    // 2. Fetch format information using ytdl-core
    // ytdl-core still needs the full URL
    const ytdlAgent = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // Add other headers if needed, but User-Agent is often key
      }
    };
    const ytdlInfo = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, {
      requestOptions: ytdlAgent,
      lang: 'en'
    });
    
    const formats = ytdlInfo.formats;

    // Process formats to separate video and audio-only
    const videoFormats = formats.filter(format => 
      format.hasVideo && format.hasAudio && format.container === 'mp4'
    ).map(format => ({
      itag: format.itag,
      qualityLabel: format.qualityLabel,
      container: format.container,
      contentLength: format.contentLength,
      hasVideo: format.hasVideo,
      hasAudio: format.hasAudio,
      url: format.url // Important for direct download if needed, but be cautious
    }));

    const audioFormats = formats.filter(format => 
      !format.hasVideo && format.hasAudio && (format.container === 'mp4' || format.container === 'webm') // Only check for valid container types
    ).map(format => ({
      itag: format.itag,
      audioBitrate: format.audioBitrate,
      container: format.container,
      contentLength: format.contentLength,
      hasVideo: format.hasVideo,
      hasAudio: format.hasAudio,
      url: format.url
    }));
    
    // Helper to parse ISO 8601 duration (e.g., PT1M30S) to seconds
    const parseDuration = (durationString?: string | null): number => {
      if (!durationString) return 0;
      const match = durationString.match(/PT(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?/);
      if (!match) return 0;
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');
      return hours * 3600 + minutes * 60 + seconds;
    };

    // Extract relevant information
    const result = {
      videoId: videoId,
      title: snippet?.title || 'Unknown Title',
      description: snippet?.description || '',
      thumbnail: snippet?.thumbnails?.maxres?.url || snippet?.thumbnails?.high?.url || snippet?.thumbnails?.medium?.url || '',
      uploader: snippet?.channelTitle || 'Unknown',
      duration: parseDuration(contentDetails?.duration),
      viewCount: parseInt(statistics?.viewCount || '0'),
      likeCount: parseInt(statistics?.likeCount || '0'),
      uploadDate: snippet?.publishedAt || '',
      channelId: snippet?.channelId,
      tags: snippet?.tags,
      liveBroadcastContent: snippet?.liveBroadcastContent,
      ytdlFormats: { // Renamed to avoid confusion with a potential future 'formats' field from Data API
        video: videoFormats,
        audioOnly: audioFormats,
      },
      // Include raw ytdl-core videoDetails if needed for specific properties
      // ytdlVideoDetails: ytdlInfo.videoDetails 
    };

    console.log('Successfully fetched video info for:', result.title);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in /api/video-info:', error);
    
    let errorMessage = 'Failed to fetch video information. Please check the URL and try again.';
    let statusCode = 500;

    if (error.message?.includes('API key not valid') || error.message?.includes('quotaExceeded')) {
      errorMessage = 'YouTube API error. Please check server configuration or API quota.';
      statusCode = 503; // Service Unavailable
    } else if (error.message?.includes('Video not found') || error.response?.status === 404) {
      errorMessage = 'Video not found or access denied.';
      statusCode = 404;
    } else if (error.message?.includes('Status code: 403') || error.message?.includes('private') || error.message?.includes('unavailable')) {
        errorMessage = 'This video is private, unavailable, or region-restricted for ytdl-core processing.';
        statusCode = 403;
    } else if (error.message?.includes('No downloadable formats')) {
        errorMessage = 'No downloadable formats could be found for this video by ytdl-core.';
        statusCode = 404; // Or 422 Unprocessable Entity
    }


    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: statusCode }
    );
  }
}
