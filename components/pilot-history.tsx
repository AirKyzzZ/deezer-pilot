"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History, ExternalLink, Music } from "lucide-react";
import { supabase, SavedPlaylist } from "@/lib/supabase";

export function PilotHistory() {
  const { data: session } = useSession();
  const [playlists, setPlaylists] = useState<SavedPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchHistory = async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    
    // Assuming we store by email for simplicity in this demo, or we'd map to a UUID
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", session.user.email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching history:", error);
    } else {
      setPlaylists(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open, session]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <History className="w-5 h-5 text-gray-400 hover:text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-[#191919] border-white/10 sm:rounded-3xl">
        <DialogHeader className="p-6 border-b border-white/5">
          <DialogTitle>Vibe History</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center text-gray-500 py-10">Loading history...</div>
          ) : playlists.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No vibes saved yet.</div>
          ) : (
            playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-deezer-purple/20 flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5 text-deezer-purple" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white truncate">{playlist.title}</h4>
                    <p className="text-xs text-gray-400">
                      {new Date(playlist.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {playlist.deezer_link && (
                  <a
                    href={playlist.deezer_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

