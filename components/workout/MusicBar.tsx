/* ============================================
   MusicBar Component
   Compact bar with quick-launch buttons for
   Spotify, Apple Music, and YouTube Music.
   Shows at the bottom of the workout player
   above the action buttons.
   ============================================ */

"use client";

import { useCallback } from "react";
import { Music } from "lucide-react";

function openWithFallback(deepLink: string, fallbackUrl: string) {
  const w = window.open(deepLink, "_blank");
  setTimeout(() => {
    if (!w || w.closed) {
      window.open(fallbackUrl, "_blank");
    }
  }, 1000);
}

export default function MusicBar() {
  const handleSpotify = useCallback(() => {
    openWithFallback("spotify://", "https://open.spotify.com");
  }, []);

  const handleAppleMusic = useCallback(() => {
    openWithFallback("music://", "https://music.apple.com");
  }, []);

  const handleYouTubeMusic = useCallback(() => {
    window.open("https://music.youtube.com", "_blank");
  }, []);

  return (
    <div className="bg-bg-panel-alt border-t border-green-dark px-4 py-2 flex items-center justify-center gap-3">
      <Music size={14} className="text-text-secondary shrink-0" />

      <button
        onClick={handleSpotify}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-green-dark bg-bg-panel text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-green-light hover:border-green-primary transition-colors"
      >
        Spotify
      </button>

      <button
        onClick={handleAppleMusic}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-green-dark bg-bg-panel text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-green-light hover:border-green-primary transition-colors"
      >
        Apple
      </button>

      <button
        onClick={handleYouTubeMusic}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-green-dark bg-bg-panel text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-green-light hover:border-green-primary transition-colors"
      >
        YouTube
      </button>
    </div>
  );
}
