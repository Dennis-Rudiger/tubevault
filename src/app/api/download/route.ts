import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const format = searchParams.get('format'); // 'video' or 'audio'
  const quality = searchParams.get('quality') || 'highest';

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
    // Validate the URL
    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Get video info to extract title for filename
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
    
    // Set up the stream options
    let options: ytdl.downloadOptions;
    let filename: string;
    let contentType: string;

    if (format === 'audio') {
      options = { 
        filter: 'audioonly',
        quality: 'highestaudio'
      };
      filename = `${videoTitle}.mp3`;
      contentType = 'audio/mpeg';
    } else {
      options = { 
        filter: 'videoandaudio',
        quality: 'highest'
      };
      filename = `${videoTitle}.mp4`;
      contentType = 'video/mp4';
    }

    // Create the download stream
    const stream = ytdl(url, options);

    // Set up response headers for file download
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Type', contentType);

    // Create a ReadableStream from the ytdl stream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });

        stream.on('end', () => {
          controller.close();
        });

        stream.on('error', (error) => {
          console.error('Stream error:', error);
          controller.error(error);
        });
      }
    });

    return new NextResponse(readableStream, {
      headers: headers,
    });

  } catch (error) {
    console.error('Error downloading video:', error);
    return NextResponse.json(
      { error: 'Failed to download video' },
      { status: 500 }
    );
  }
}
