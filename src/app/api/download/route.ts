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

    // Validate that it's a valid YouTube URL
    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: 'Invalid or unsupported YouTube URL' },
        { status: 400 }
      );
    }

    console.log(`Starting ${format} download for:`, url);

    // Get video info to determine the best format
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    let downloadOptions: ytdl.downloadOptions;
    let contentType: string;
    let filename: string;

    if (format === 'audio') {
      // For audio, get the best audio-only format
      downloadOptions = {
        filter: 'audioonly',
        quality: 'highestaudio',
      };
      contentType = 'audio/mp4';
      filename = `${videoDetails.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'audio'}.m4a`;
    } else {
      // For video, get the best video+audio format
      downloadOptions = {
        filter: format => format.hasVideo && format.hasAudio,
        quality: 'highest',
      };
      contentType = 'video/mp4';
      filename = `${videoDetails.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'video'}.mp4`;
    }

    // Create the download stream
    const stream = ytdl(url, downloadOptions);

    // Set up response headers for file download
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Type', contentType);

    // Convert Node.js stream to ReadableStream for the Response
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });

        stream.on('end', () => {
          console.log(`${format} download completed:`, filename);
          controller.close();
        });

        stream.on('error', (error: Error) => {
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
      { error: `Failed to download ${format}` },
      { status: 500 }
    );
  }
}
