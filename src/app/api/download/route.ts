import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const format = searchParams.get('format'); // 'video' or 'audio'

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  if (!format || !['video', 'audio'].includes(format)) {
    return NextResponse.json(
      { error: 'Format must be either "video" or "audio"' },
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
    
    console.log(`Starting ${format} download for:`, url);
    
    // Configure ytdl-core with better options to avoid 403 errors
    const agent = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    };
    
    // Get video info first to extract title for filename
    const info = await ytdl.getInfo(url, { 
      requestOptions: agent,
      lang: 'en'
    });
    const videoTitle = info.videoDetails.title?.replace(/[^\w\s-]/g, '').trim() || 'video';
    
    // Check if video has available formats
    const availableFormats = info.formats.filter(format => 
      format.hasAudio || format.hasVideo
    );
    
    if (availableFormats.length === 0) {
      return NextResponse.json(
        { error: 'No downloadable formats available for this video. This might be due to YouTube restrictions.' },
        { status: 403 }
      );
    }
    
    let downloadOptions: ytdl.downloadOptions = {};
    let contentType: string;
    let filename: string;

    if (format === 'audio') {
      // Try to find audio-only formats first
      const audioFormats = availableFormats.filter(f => f.hasAudio && !f.hasVideo);
      if (audioFormats.length === 0) {
        return NextResponse.json(
          { error: 'No audio-only formats available for this video.' },
          { status: 403 }
        );
      }
      
      downloadOptions = { 
        filter: 'audioonly',
        quality: 'highestaudio',
        requestOptions: agent,
      };
      contentType = 'audio/mp4';
      filename = `${videoTitle}.m4a`;
    } else {
      // Try to find video formats with audio
      const videoFormats = availableFormats.filter(f => f.hasVideo && f.hasAudio);
      if (videoFormats.length === 0) {
        return NextResponse.json(
          { error: 'No video formats with audio available for this video.' },
          { status: 403 }
        );
      }
      
      downloadOptions = { 
        quality: 'highest',
        filter: (formatItem: ytdl.videoFormat) => formatItem.container === 'mp4' && formatItem.hasVideo && formatItem.hasAudio,
        requestOptions: agent,
      };
      contentType = 'video/mp4';
      filename = `${videoTitle}.mp4`;
    }

    console.log(`Download options for ${format}:`, downloadOptions);

    // Create the download stream with error handling
    const stream = ytdl(url, downloadOptions);
    
    // Set up response headers for file download
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'no-cache');

    // Convert Node.js stream to Web API ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(chunk));
        });

        stream.on('end', () => {
          console.log(`${format} download completed for:`, videoTitle);
          controller.close();
        });

        stream.on('error', (error) => {
          console.error(`${format} download error:`, error);
          controller.error(error);
        });
      },
      cancel() {
        stream.destroy();
      }
    });

    return new NextResponse(readableStream, {
      headers: headers,
    });

  } catch (error) {
    console.error(`Error downloading ${format}:`, error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('403') || error.message.includes('Status code: 403')) {
        return NextResponse.json(
          { error: 'YouTube is currently blocking download requests. This video may be region-restricted or have download protection. Please try a different video or try again later.' },
          { status: 403 }
        );
      }
      if (error.message.includes('private') || error.message.includes('unavailable')) {
        return NextResponse.json(
          { error: 'This video is private or unavailable for download.' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: `Failed to download ${format}. The video may be restricted or temporarily unavailable. Please try again later.` },
      { status: 500 }
    );
  }
}