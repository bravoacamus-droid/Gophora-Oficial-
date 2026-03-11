import { useState, useCallback } from 'react';
import { AlertTriangle, Play, ExternalLink } from 'lucide-react';

/**
 * Extract YouTube video ID from any YouTube URL format.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
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

/**
 * Convert any YouTube URL to proper embed URL.
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

interface YouTubeVideoPlayerProps {
  url: string;
  title?: string;
  className?: string;
}

export default function YouTubeVideoPlayer({ url, title = 'Video', className = '' }: YouTubeVideoPlayerProps) {
  const [iframeError, setIframeError] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <div className={`aspect-video rounded-xl bg-muted flex flex-col items-center justify-center gap-2 border border-border/50 ${className}`}>
        <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground text-center px-4">
          Video unavailable. Please check the YouTube link.
        </p>
      </div>
    );
  }

  const thumbnailUrl = getYouTubeThumbnail(videoId);
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // If iframe failed or hasn't been activated yet, show clickable thumbnail
  if (!showPlayer || iframeError) {
    return (
      <div className={`aspect-video rounded-xl overflow-hidden bg-muted relative group cursor-pointer ${className}`}>
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Play button overlay - clicking activates the embed */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/20 group-hover:bg-foreground/30 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (iframeError) {
              // If embed failed, open YouTube directly
              window.open(watchUrl, '_blank', 'noopener,noreferrer');
            } else {
              setShowPlayer(true);
            }
          }}
        >
          <div className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="h-7 w-7 text-white ml-1 fill-white" />
          </div>
          {iframeError && (
            <span className="mt-3 text-xs text-white bg-foreground/60 px-3 py-1 rounded-full flex items-center gap-1.5">
              <ExternalLink className="h-3 w-3" /> Abrir en YouTube
            </span>
          )}
        </div>
      </div>
    );
  }

  // Show embedded player
  return (
    <div className={`aspect-video rounded-xl overflow-hidden bg-muted relative ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onError={() => setIframeError(true)}
      />
    </div>
  );
}
