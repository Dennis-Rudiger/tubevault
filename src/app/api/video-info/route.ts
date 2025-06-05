import { NextRequest, NextResponse } from 'next/server';
import YTDlpWrap from 'yt-dlp-wrap';

interface VideoFormat {
  vcodec?: string;
  acodec?: string;
  format_id?: string;
  ext?: string;
  filesize?: number;
  height?: number;
  width?: number;
}

interface VideoData {
  title?: string;
  description?: string;
  thumbnail?: string;
  uploader?: string;
  duration?: number;
  view_count?: number;
  upload_date?: string;
  formats?: VideoFormat[];
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

  try {
    // Basic URL validation for YouTube
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/;
    if (!youtubeRegex.test(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Initialize YTDlpWrap
    const ytDlpWrap = new YTDlpWrap();

    // Get video info using yt-dlp-wrap
    const info = await ytDlpWrap.execPromise([
      url,
      '--dump-single-json',
      '--no-check-certificates',
      '--no-warnings'
    ]);    // Parse the JSON output if info is a string
    const videoData: VideoData = typeof info === 'string' ? JSON.parse(info) : info;    // Extract relevant information
    const result = {
      title: videoData.title || 'Unknown Title',
      description: videoData.description || '',
      thumbnail: videoData.thumbnail || '',
      duration: videoData.duration || 0,
      uploader: videoData.uploader || 'Unknown',
      viewCount: videoData.view_count || 0,
      uploadDate: videoData.upload_date || '',formats: {
        video: videoData.formats?.filter((format: VideoFormat) => format.vcodec !== 'none' && format.acodec !== 'none') || [],
        audioOnly: videoData.formats?.filter((format: VideoFormat) => format.vcodec === 'none' && format.acodec !== 'none') || [],
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching video info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video information. Please check the URL and try again.' },
      { status: 500 }
    );
  }
}
