export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "TubeVault",
    "description": "Download YouTube videos and audio files instantly with our beautiful and powerful downloader",
    "url": "https://tubevault.vercel.app",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "TubeVault Team"
    },
    "featureList": [
      "Download YouTube videos in MP4 format",
      "Extract audio from YouTube videos",
      "High-quality downloads",
      "Fast processing",
      "No registration required"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
