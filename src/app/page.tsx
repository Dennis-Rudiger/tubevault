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
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  TubeVault
                </span>
              </h1>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="h-1 w-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"></div>
                <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                <div className="h-1 w-4 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"></div>
              </div>
            </div>
            <p className="text-xl leading-8 text-gray-300 sm:text-2xl">
              Download YouTube videos and audio instantly with our powerful, fast, and beautiful downloader.
            </p>
            <p className="mt-4 text-lg text-gray-400">
              High-quality downloads • Lightning fast • Always free
            </p>
          </div>
        </div>
      </div>

      {/* Main App Section */}
      <div className="relative mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-xl border border-white/20 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-center mb-2">Get Started</h2>
            <p className="text-gray-300 text-center">Paste your YouTube URL below to begin</p>
          </div>
          <div className="mb-6">
            <label htmlFor="youtubeUrl" className="mb-3 block text-sm font-semibold text-gray-200">
              YouTube Video URL
            </label>
            <div className="relative">
              <input
                type="url"
                name="youtubeUrl"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  setError(null); // Clear error when user types
                }}
                className="block w-full rounded-xl border-0 bg-white/5 py-4 px-6 text-white placeholder-gray-400 backdrop-blur-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-cyan-400 sm:text-sm sm:leading-6 transition-all duration-200"
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1a4 4 0 000-5.656z" />
                </svg>
              </div>
            </div>
            {error && (
              <div className="mt-3 flex items-center space-x-2 text-red-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleFetchVideo}
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:from-cyan-600 hover:to-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analyzing Video...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Fetch Video Info</span>
              </div>
            )}
          </button>

          {isLoading && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center space-x-2 text-gray-400">
                <div className="animate-pulse h-2 w-2 bg-cyan-400 rounded-full"></div>
                <div className="animate-pulse h-2 w-2 bg-blue-400 rounded-full" style={{animationDelay: '0.2s'}}></div>
                <div className="animate-pulse h-2 w-2 bg-purple-400 rounded-full" style={{animationDelay: '0.4s'}}></div>
              </div>
              <p className="mt-2 text-gray-400">Fetching video details...</p>
            </div>
          )}

          {videoDetails && !isLoading && (
            <div className="mt-10 animate-fadeIn">
              <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-sm border border-white/10">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:w-80 flex-shrink-0">
                    <img
                      src={videoDetails.thumbnail}
                      alt="Video thumbnail"
                      className="w-full h-auto rounded-xl shadow-lg object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-4 line-clamp-2">{videoDetails.title}</h3>
                    <div className="space-y-2 text-sm text-gray-300 mb-6">
                      <p><span className="font-medium">Channel:</span> {videoDetails.author}</p>
                      <p><span className="font-medium">Duration:</span> {Math.floor(videoDetails.duration / 60)}:{(videoDetails.duration % 60).toString().padStart(2, '0')}</p>
                      <p><span className="font-medium">Views:</span> {videoDetails.viewCount?.toLocaleString()}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => handleDownload("video")}
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4L5.5 6M17 4l1.5 2M5.5 6h13M5.5 6L4 8.5M18.5 6L20 8.5M4 8.5V19a1 1 0 001 1h14a1 1 0 001-1V8.5" />
                          </svg>
                          <span>Download Video</span>
                        </div>
                        <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-300 group-hover:translate-x-full"></div>
                      </button>
                      
                      <button
                        onClick={() => handleDownload("audio")}
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-purple-600 hover:to-pink-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                          <span>Download Audio</span>
                        </div>
                        <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-300 group-hover:translate-x-full"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
            <p className="text-gray-300 text-sm">Download videos and audio at maximum speed with our optimized servers.</p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">High Quality</h3>
            <p className="text-gray-300 text-sm">Get the best available quality for both video and audio downloads.</p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Secure & Private</h3>
            <p className="text-gray-300 text-sm">Your data is safe. We don't store any videos or personal information.</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400 text-sm">
          <p>&copy; 2025 TubeVault. All rights reserved. • For educational purposes only.</p>
          <p className="mt-2">Please respect YouTube's Terms of Service and copyright laws.</p>
        </footer>
      </div>
    </main>
  );
}
