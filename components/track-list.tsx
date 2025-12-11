"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { DeezerTrack } from "@/lib/deezer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TrackListProps {
  tracks: DeezerTrack[];
}

export function TrackList({ tracks }: TrackListProps) {
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
    }
  }, []);

  const togglePlay = (track: DeezerTrack) => {
    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.preview;
        audioRef.current.play();
        setPlayingTrackId(track.id);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <audio ref={audioRef} onEnded={() => setPlayingTrackId(null)} />
      {tracks.map((track) => (
        <Card
          key={track.id}
          className="flex items-center p-4 space-x-4 bg-surface/50 border-white/5 hover:bg-surface transition-colors group"
        >
          <div className="relative shrink-0">
            <img
              src={track.album.cover_medium}
              alt={track.title}
              className="w-16 h-16 rounded-2xl object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-2xl">
              <Button
                size="icon"
                variant="ghost"
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm"
                onClick={() => togglePlay(track)}
              >
                {playingTrackId === track.id ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-1" />
                )}
              </Button>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-white truncate">{track.title}</h4>
            <p className="text-sm text-gray-400 truncate">{track.artist.name}</p>
          </div>
          <div className="text-xs text-gray-500 font-mono">
            {Math.floor(track.duration / 60)}:
            {(track.duration % 60).toString().padStart(2, "0")}
          </div>
        </Card>
      ))}
    </div>
  );
}

