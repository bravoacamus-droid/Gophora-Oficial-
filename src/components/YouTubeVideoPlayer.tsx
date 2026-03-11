import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Extract YouTube video ID from any YouTube URL format.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Check if a URL is a YouTube link.
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Get YouTube thumbnail URL from video ID.
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

interface YouTubeVideoPlayerProps {
  url: string;
  title?: string;
  className?: string;
}

export default function YouTubeVideoPlayer({ url, title = 'Video', className = '' }: YouTubeVideoPlayerProps) {
  const [error, setError] = useState(false);
  const videoId = extractYouTubeId(url);

  if (!videoId || error) {
    return (
      <div className={`aspect-video rounded-xl bg-muted flex flex-col items-center justify-center gap-2 border border-border/50 ${className}`}>
        <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground text-center px-4">
          Video unavailable. Please check the YouTube link.
        </p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;

  return (
    <div className={`aspect-video rounded-xl overflow-hidden bg-muted ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onError={() => setError(true)}
      />
    </div>
  );
}
