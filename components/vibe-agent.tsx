"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Search, Loader2, Save, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPlaylist, addTracksToPlaylist } from "@/lib/deezer-api";
import { generateVibe, VibeResult } from "@/app/actions/chat";
import { TrackList } from "@/components/track-list";
import { VibeChart } from "@/components/vibe-chart";
import { supabase } from "@/lib/supabase";

// Extend Window interface for SpeechRecognition
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export function VibeAgent() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VibeResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSpeechSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
        toast.success("Voice input captured!");
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsRecording(false);
        
        // Handle different error types
        if (event.error === "not-allowed") {
          console.error("Speech recognition error: not-allowed");
          toast.error("Microphone permission denied. Please click the microphone icon again and allow access when prompted.");
        } else if (event.error === "no-speech") {
          // Silent failure - user might have just stopped talking
          console.log("No speech detected");
        } else if (event.error === "aborted") {
          // User stopped recording manually or recognition was stopped
          console.log("Recording aborted");
        } else if (event.error === "network") {
          // Network errors are common and often transient with Web Speech API
          // Don't log to console to reduce noise - just notify user
          toast.info("Network connection issue detected. Speech recognition requires internet. Please check your connection and try again.", {
            duration: 3000,
          });
        } else if (event.error === "audio-capture") {
          console.error("Speech recognition error: audio-capture");
          toast.error("No microphone found or microphone is being used by another application.");
        } else if (event.error === "service-not-allowed") {
          console.error("Speech recognition error: service-not-allowed");
          toast.error("Speech recognition service is not available. Please try again later.");
        } else {
          console.warn("Speech recognition error:", event.error);
          toast.error(`Speech recognition error: ${event.error}. Please try again.`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      // Check if we're on HTTPS or localhost (required for microphone access)
      const isSecureContext = window.isSecureContext || 
        window.location.protocol === 'https:' || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1';

      if (!isSecureContext) {
        toast.error("Microphone access requires HTTPS or localhost.");
        return false;
      }

      // Request microphone permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: unknown) {
      console.error("Microphone permission error:", error);
      const err = error as { name?: string; message?: string };
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Microphone permission denied. Please allow microphone access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        toast.error("No microphone found. Please connect a microphone and try again.");
      } else {
        toast.error("Failed to access microphone. Please check your browser settings.");
      }
      return false;
    }
  };

  const toggleRecording = async () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // Request microphone permission first
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        return;
      }

      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.info("Listening... Speak now!");
      } catch (error: unknown) {
        console.error("Error starting speech recognition:", error);
        setIsRecording(false);
        
        // Handle specific errors
        const err = error as { name?: string; message?: string };
        if (err.name === "NotAllowedError" || err.message?.includes("not-allowed")) {
          toast.error("Microphone permission denied. Please allow microphone access and try again.");
        } else if (err.message?.includes("already started")) {
          // Recognition is already running, just update state
          setIsRecording(true);
        } else {
          toast.error("Failed to start recording. Please try again.");
        }
      }
    }
  };

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
      {/* Search Section - Hero Element */}
      <div className="relative w-full max-w-4xl mx-auto z-10 pt-8 md:pt-16">
        <form onSubmit={handleSubmit} className="relative group">
          <div
            className={`absolute -inset-2 bg-gradient-to-r from-deezer-purple to-purple-600 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 ${
              isLoading ? "animate-pulse-glow opacity-80" : ""
            }`}
          ></div>
          <div className="relative flex items-center">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your vibe (e.g. 'Cyberpunk coding session at 2AM')"
              className="pr-36 h-20 text-2xl md:text-3xl bg-black/80 border-white/20 backdrop-blur-sm placeholder:text-gray-500 focus-visible:border-deezer-purple/50 focus-visible:ring-deezer-purple/30"
              disabled={isLoading || isRecording}
            />
            <div className="absolute right-3 flex items-center gap-3">
              {isSpeechSupported && (
                <Button
                  type="button"
                  size="icon"
                  onClick={toggleRecording}
                  className={`w-14 h-14 rounded-full transition-all ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 animate-pulse"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                  disabled={isLoading}
                  title={isRecording ? "Stop recording" : "Start voice input"}
                >
                  {isRecording ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </Button>
              )}
              <Button
                type="submit"
                size="icon"
                className="w-14 h-14 rounded-full bg-deezer-purple hover:bg-deezer-purple/90 shadow-lg shadow-deezer-purple/30"
                disabled={isLoading || isRecording}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Search className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
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

