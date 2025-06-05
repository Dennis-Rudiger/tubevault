"use client";

import { useState } from "react";

export default function HomePage() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoDetails, setVideoDetails] = useState<any>(null); // We'll define a proper type later
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchVideo = async () => {
    if (!youtubeUrl) {
      setError("Please paste a YouTube URL.");
      return;
    }
    setError(null);
    setIsLoading(true);
    setVideoDetails(null); // Clear previous details

    try {
      const response = await fetch(`/api/video-info?url=${encodeURIComponent(youtubeUrl)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch video information.");
      }
      const data = await response.json();
      setVideoDetails(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (format: "video" | "audio") => {
    if (!videoDetails || !youtubeUrl) return;
    
    // Create a link element to trigger download
    const downloadUrl = `/api/download?url=${encodeURIComponent(youtubeUrl)}&format=${format}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
      <div className="w-full max-w-2xl rounded-xl bg-slate-800/50 p-8 shadow-2xl backdrop-blur-md">
        <h1 className="mb-8 text-center text-4xl font-bold tracking-tight text-sky-400">
          YouTube Downloader
        </h1>

        <div className="mb-6">
          <label htmlFor="youtubeUrl" className="mb-2 block text-sm font-medium text-slate-300">
            Paste YouTube Video Link
          </label>
          <div className="flex rounded-md shadow-sm">
            <input
              type="url"
              name="youtubeUrl"
              id="youtubeUrl"
              value={youtubeUrl}
              onChange={(e) => {
                setYoutubeUrl(e.target.value);
                setError(null); // Clear error when user types
              }}
              className="block w-full flex-1 rounded-none rounded-l-md border-0 bg-slate-700 py-3 px-4 text-slate-100 placeholder-slate-400 ring-1 ring-inset ring-slate-600 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <button
              onClick={handleFetchVideo}
              disabled={isLoading}
              className="inline-flex items-center rounded-r-md bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "Fetch"
              )}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>

        {isLoading && (
          <div className="text-center py-10">
            <p className="text-slate-400">Fetching video details...</p>
          </div>
        )}

        {videoDetails && !isLoading && (
          <div className="mt-10 animate-fadeIn rounded-lg bg-slate-700/30 p-6">
            <h2 className="text-2xl font-semibold text-sky-300 mb-4">{videoDetails.title}</h2>
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={videoDetails.thumbnail}
                alt="Video thumbnail"
                className="w-full md:w-60 h-auto rounded-md shadow-lg object-cover"
              />
              <div className="flex-1">
                {/* <p className="text-slate-300 mb-2"><strong>Duration:</strong> {videoDetails.duration}</p> */}
                {/* Add more details here if needed */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleDownload("video")}
                    className="flex-1 rounded-md bg-green-500 px-6 py-3 text-sm font-semibold text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Download Video (MP4)
                  </button>
                  <button
                    onClick={() => handleDownload("audio")}
                    className="flex-1 rounded-md bg-purple-500 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    Download Audio (MP3)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="mt-12 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} YouTube Downloader. For personal use only.</p>
        <p>Enjoy ❤️.</p>
      </footer>
    </main>
  );
}

// Basic fadeIn animation for when video details appear
// Add this to your globals.css or a relevant CSS file if you prefer
// @keyframes fadeIn {
//   from { opacity: 0; transform: translateY(10px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fadeIn {
//   animation: fadeIn 0.5s ease-out forwards;
// }
