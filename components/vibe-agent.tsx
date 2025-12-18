"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Search, Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeezerTrack, createPlaylist, addTracksToPlaylist } from "@/lib/deezer-api";
import { generateVibe, VibeResult } from "@/app/actions/chat";
import { TrackList } from "@/components/track-list";
import { VibeChart } from "@/components/vibe-chart";
import { supabase } from "@/lib/supabase";

export function VibeAgent() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VibeResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const data = await generateVibe(query);
      if (data.tracks.length === 0) {
        toast.error("No tracks found. Try a different search query or check the console for details.", {
          duration: 5000,
        });
      }
      setResult(data);
    } catch (error) {
      console.error("Vibe generation error:", error);
      toast.error(
        error instanceof Error 
          ? `Failed to generate vibe: ${error.message}` 
          : "Failed to generate vibe. Try again.",
        { duration: 5000 }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToDeezer = async () => {
    if (!session?.accessToken || !result) {
      toast.error("Playlist saving requires Deezer authentication. Please configure DEEZER_CLIENT_ID and DEEZER_CLIENT_SECRET in your .env.local file.", {
        duration: 5000,
      });
      return;
    }

    setIsSaving(true);
    try {
      const title = `Pilot: ${query}`; // Simple naming
      const playlist = await createPlaylist(title, session.accessToken);
      const trackIds = result.tracks.map((t) => t.id);
      await addTracksToPlaylist(playlist.id, trackIds, session.accessToken);
      
      toast.success("Playlist created on Deezer!", {
        action: {
          label: "Open",
          onClick: () => window.open(playlist.link, "_blank"),
        },
      });
      
      // Save to local history
      if (session.user?.email) {
        await supabase.from("playlists").insert({
            user_id: session.user.email,
            title: title,
            tracks: result.tracks,
            tags: [result.params.query], // simplified tags
            vibe_metrics: result.params,
            deezer_link: playlist.link,
        });
      }
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to save playlist to Deezer.");
    } finally {
      setIsSaving(false);
    }
  };

  const canSaveToDeezer = !!session?.accessToken;

  // Calculate metrics for the chart (simplified estimation)
  const metrics = result
    ? {
        energy: result.params.bpm_min ? Math.min((result.params.bpm_min / 180) * 100, 100) : 60,
        popularity:
          result.tracks.reduce((acc, t) => acc + t.rank, 0) /
            result.tracks.length /
            10000 || 50, // rank is usually 0-999999? Deezer rank is 0-1000000 approx
        tempo: result.params.bpm_min ? Math.min((result.params.bpm_min / 200) * 100, 100) : 50,
        mood: 75, // Placeholder
      }
    : { energy: 0, popularity: 0, tempo: 0, mood: 0 };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      {/* Search Section */}
      <div className="relative w-full max-w-2xl mx-auto z-10">
        <form onSubmit={handleSubmit} className="relative group">
          <div
            className={`absolute -inset-1 bg-gradient-to-r from-deezer-purple to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 ${
              isLoading ? "animate-pulse-glow opacity-100" : ""
            }`}
          ></div>
          <div className="relative flex items-center">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your vibe (e.g. 'Cyberpunk coding session at 2AM')"
              className="pr-16 text-lg bg-black border-white/10"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 w-10 h-10 rounded-full bg-deezer-purple hover:bg-deezer-purple/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Powered by AI & Deezer API
        </p>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Vibe Analysis Chart */}
              <div className="lg:col-span-1">
                <VibeChart metrics={metrics} />
                <div className="mt-6 p-6 rounded-[2rem] border border-white/5 bg-surface/30">
                  <h4 className="text-deezer-purple font-bold mb-2">
                    AI Insight
                  </h4>
                  <p className="text-sm text-gray-400">
                    {result.explanation}
                  </p>
                </div>
              </div>

              {/* Track List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Generated Tracks</h2>
                  <Button
                    onClick={handleSaveToDeezer}
                    disabled={isSaving || !canSaveToDeezer}
                    className="bg-deezer-purple hover:bg-deezer-purple/90 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!canSaveToDeezer ? "Deezer authentication required to save playlists" : undefined}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save to Deezer
                  </Button>
                </div>
                {!canSaveToDeezer && (
                  <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-yellow-200 text-sm">
                    💡 <strong>Note:</strong> Playlist saving is disabled in development mode. Configure Deezer OAuth credentials to enable this feature.
                  </div>
                )}
                <TrackList tracks={result.tracks} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

