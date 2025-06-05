import { NextRequest, NextResponse } from 'next/server';
import YTDlpWrap from 'yt-dlp-wrap';
import { createReadStream, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

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

    // Generate a temporary filename
    const tempDir = tmpdir();
    const timestamp = Date.now();
    let outputTemplate: string;
    let filename: string;
    let contentType: string;

    if (format === 'audio') {
      outputTemplate = join(tempDir, `audio_${timestamp}.%(ext)s`);
      filename = `audio_${timestamp}.mp3`;
      contentType = 'audio/mpeg';
    } else {
      outputTemplate = join(tempDir, `video_${timestamp}.%(ext)s`);
      filename = `video_${timestamp}.mp4`;
      contentType = 'video/mp4';
    }

    // Set up download options
    const downloadOptions = [
      url,
      '--output', outputTemplate,
      '--no-check-certificates',
      '--no-warnings'
    ];

    if (format === 'audio') {
      downloadOptions.push(
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '0'
      );
    } else {
      downloadOptions.push(
        '--format', 'best[ext=mp4]'
      );
    }

    // Download the file
    await ytDlpWrap.execPromise(downloadOptions);

    // Find the downloaded file (yt-dlp might change the extension)
    const { readdirSync } = await import('fs');
    const files = readdirSync(tempDir);
    const downloadedFile = files.find(file => 
      file.startsWith(format === 'audio' ? `audio_${timestamp}` : `video_${timestamp}`)
    );

    if (!downloadedFile) {
      throw new Error('Downloaded file not found');
    }

    const filePath = join(tempDir, downloadedFile);
    
    // Get the actual filename for download
    const actualExtension = downloadedFile.split('.').pop();
    const downloadFilename = format === 'audio' ? 
      `audio_${timestamp}.${actualExtension}` : 
      `video_${timestamp}.${actualExtension}`;

    // Set up response headers for file download
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    headers.set('Content-Type', contentType);

    // Create a ReadableStream from the file
    const fileStream = createReadStream(filePath);
    
    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk: string | Buffer) => {
          if (typeof chunk === 'string') {
            controller.enqueue(new TextEncoder().encode(chunk));
          } else {
            controller.enqueue(new Uint8Array(chunk));
          }
        });

        fileStream.on('end', () => {
          // Clean up the temporary file
          try {
            unlinkSync(filePath);
          } catch (error) {
            console.error('Error cleaning up temp file:', error);
          }
          controller.close();
        });

        fileStream.on('error', (error: Error) => {
          console.error('File stream error:', error);
          // Clean up the temporary file on error
          try {
            unlinkSync(filePath);
          } catch (cleanupError) {
            console.error('Error cleaning up temp file on error:', cleanupError);
          }
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
