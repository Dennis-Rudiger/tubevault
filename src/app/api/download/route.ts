import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

// Helper to extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  if (!url) return null;
  // Order matters: more specific regexes should come first.
  const regexes = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/, // Standard watch URL
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/, // Shortened URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/, // Embed URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/, // V URL (older)
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/, // Shorts URL
  ];
  for (const regex of regexes) {
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }
  // If no regex matches, check if the input itself is a valid 11-character ID
  if (url.length === 11 && /^[a-zA-Z0-9_-]+$/.test(url)) {
    return url;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  let videoUrlOrId = searchParams.get('url'); // Can be URL or video ID
  if (!videoUrlOrId) {
    videoUrlOrId = searchParams.get('videoId'); // Fallback to videoId if url is not present
  }
  const itagString = searchParams.get('itag');
  const filename = searchParams.get('filename');

  if (!videoUrlOrId) {
    return NextResponse.json(
      { error: 'URL or video ID parameter is required' },
      { status: 400 }
    );
  }

  if (!itagString) {
    return NextResponse.json(
      { error: 'itag parameter is required' },
      { status: 400 }
    );
  }
  const itag = parseInt(itagString);
  if (isNaN(itag)) {
    return NextResponse.json(
      { error: 'itag parameter must be a number' },
      { status: 400 }
    );
  }

  if (!filename) {
    return NextResponse.json(
      { error: 'filename parameter is required' },
      { status: 400 }
    );
  }

  let videoId = extractVideoId(videoUrlOrId);
  if (!videoId) {
    return NextResponse.json(
        { error: 'Invalid YouTube URL or Video ID provided' },
        { status: 400 }
    );
  }
  
  const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    // Validate that it's a valid YouTube URL for ytdl-core before proceeding
    if (!ytdl.validateURL(fullUrl)) {
      return NextResponse.json(
        { error: 'Invalid or unsupported YouTube URL according to ytdl-core' },
        { status: 400 }
      );
    }
    
    console.log(`Attempting download for video ID: ${videoId}, itag: ${itag}, filename: ${filename}`);
    
    // Configure ytdl-core with better options to potentially avoid 403 errors
    const agent = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36', // Updated Chrome version
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1', // Do Not Track
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    };
    
    // Get video info to find the specific format by itag and its mimeType
    const info = await ytdl.getInfo(fullUrl, { 
      requestOptions: agent,
      lang: 'en'
    });

    const formatInfo = info.formats.find(f => f.itag === itag);

    if (!formatInfo) {
      console.error(`Format with itag ${itag} not found for video ${videoId}. Available itags: ${info.formats.map(f => f.itag).join(', ')}`);
      return NextResponse.json(
        { error: `Format with itag ${itag} not found for this video. Please ensure the itag is correct and available.` },
        { status: 404 }
      );
    }

    const contentType = formatInfo.mimeType || 'application/octet-stream'; // Fallback contentType
    
    const downloadOptions: ytdl.downloadOptions = { 
      quality: itag, // ytdl-core uses the itag number directly for the quality parameter
      requestOptions: agent,
    };

    console.log(`Found format for itag ${itag}: ${formatInfo.mimeType}. Download options:`, downloadOptions);

    // Create the download stream with error handling
    const stream = ytdl(fullUrl, downloadOptions);
    
    // Set up response headers for file download
    const headers = new Headers();
    const encodedFilename = encodeURIComponent(filename);
    // Corrected Content-Disposition for broader compatibility
    headers.set('Content-Disposition', `attachment; filename=\"${encodedFilename}\"; filename*=UTF-8\'\'${encodedFilename}`);
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    // Convert Node.js stream to Web API ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(chunk));
        });

        stream.on('end', () => {
          console.log(`Download stream ended for: ${filename}`);
          controller.close();
        });

        stream.on('error', (error) => {
          console.error(`Download stream error for ${filename}:`, error);
          // Ensure the error is propagated to the client response
          controller.error(new Error(`Stream error: ${error.message}`)); 
        });
      },
      cancel() {
        console.log(`Download stream cancelled for: ${filename}`);
        stream.destroy();
      }
    });

    return new NextResponse(readableStream, {
      headers: headers,
    });

  } catch (error: any) {
    console.error(`Error in GET /api/download (Video ID: ${videoId}, itag: ${itag}):`, error);
    
    let errorMessage = `Failed to download video. An unexpected error occurred.`;
    let errorStatus = 500;

    if (error.message) {
        if (error.message.includes('403') || error.message.includes('Status code: 403') || (error.statusCode === 403)) {
            errorMessage = 'YouTube is blocking the download request. This video may be region-restricted, age-restricted, or have other download protections. Please try a different video or try again later.';
            errorStatus = 403;
        } else if (error.message.includes('private') || error.message.includes('unavailable')) {
            errorMessage = 'This video is private or unavailable for download.';
            errorStatus = 404;
        } else if (error.message.includes('No such format found') || (error.message.includes('itag') && error.message.includes('not found'))) {
            errorMessage = `The requested format (itag ${itag}) is not available for this video, or it could not be processed by ytdl-core. It might be an invalid or unsupported format type.`;
            errorStatus = 400;
        } else if (error.message.includes('This video is unavailable')) {
            errorMessage = 'The video is unavailable. It may have been deleted or set to private.';
            errorStatus = 404;
        }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: errorStatus }
    );
  }
}