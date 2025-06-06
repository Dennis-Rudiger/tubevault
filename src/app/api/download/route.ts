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
    }    console.log(`Starting ${format} download for:`, url);
    
    // Get video info first to extract title for filename
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title?.replace(/[^\w\s-]/g, '').trim() || 'video';
    
    let downloadOptions: ytdl.downloadOptions = {};
    let contentType: string;
    let filename: string;

    if (format === 'audio') {
      // Download highest quality audio-only format
      downloadOptions = { 
        filter: 'audioonly',
        quality: 'highestaudio'
      };
      contentType = 'audio/mp4';
      filename = `${videoTitle}.m4a`;
    } else {
      // Download highest quality video format with audio
      downloadOptions = { 
        quality: 'highest',
        filter: (formatItem: ytdl.videoFormat) => formatItem.container === 'mp4' && formatItem.hasVideo && formatItem.hasAudio
      };
      contentType = 'video/mp4';
      filename = `${videoTitle}.mp4`;
    }

    console.log(`Download options for ${format}:`, downloadOptions);

    // Create the download stream
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
    return NextResponse.json(
      { error: `Failed to download ${format}. Please try again.` },
      { status: 500 }
    );
  }
}