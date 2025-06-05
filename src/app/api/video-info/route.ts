import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';

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
    // Validate the URL
    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    // Extract relevant information
    const result = {
      title: videoDetails.title,
      description: videoDetails.description,
      thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url,
      duration: videoDetails.lengthSeconds,
      author: videoDetails.author.name,
      viewCount: videoDetails.viewCount,
      uploadDate: videoDetails.uploadDate,
      formats: {
        video: info.formats.filter(format => format.hasVideo && format.hasAudio),
        audioOnly: info.formats.filter(format => format.hasAudio && !format.hasVideo),
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching video info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video information' },
      { status: 500 }
    );
  }
}
