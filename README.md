# TubeVault 🎬

A beautiful and powerful YouTube video and audio downloader with modern UI. Built with Next.js, TypeScript, and Tailwind CSS.

## ✨ Features

- 🎥 **Download YouTube videos** in high quality MP4 format
- 🎵 **Extract and download audio** from YouTube videos  
- 🎨 **Beautiful, modern UI** with gradient backgrounds and smooth animations
- 📱 **Fully responsive design** that works perfectly on all devices
- ⚡ **Lightning fast downloads** using yt-dlp-wrap
- 🔒 **Secure and private** - no data stored on servers
- 💾 **Direct downloads** without temporary server storage
- 🎯 **SEO optimized** with proper meta tags and structured data
- 📱 **PWA ready** - can be installed as an app

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript  
- **Styling**: Tailwind CSS with custom animations
- **YouTube Processing**: yt-dlp-wrap (reliable and fast)
- **Deployment**: Optimized for Vercel
- **SEO**: Meta tags, Open Graph, Twitter Cards, Structured Data

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How to Use

1. Open the application in your browser
2. Paste a YouTube URL in the input field
3. Click "Fetch Video Info" to load video details
4. Choose your preferred format:
   - **Download Video**: Get the full video with audio
   - **Download Audio Only**: Extract just the audio track
5. The file will be downloaded directly to your device

## API Endpoints

### GET /api/video-info
Fetches video metadata from a YouTube URL.

**Parameters:**
- `url`: YouTube video URL

**Response:**
```json
{
  "title": "Video Title",
  "description": "Video description",
  "thumbnail": "thumbnail_url",
  "duration": 120,
  "author": "Channel Name",
  "viewCount": 1000000,
  "uploadDate": "20231201"
}
```

### GET /api/download
Downloads video or audio from a YouTube URL.

**Parameters:**
- `url`: YouTube video URL
- `format`: Either "video" or "audio"
- `quality`: Quality preference (optional, defaults to "highest")

## Deployment

This project is ready to be deployed on Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Deploy with one click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/youtube-downloader)

## License

This project is for educational purposes only. Please respect YouTube's Terms of Service and copyright laws.
