"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { searchDeezerTracks, type DeezerTrack } from "@/lib/deezer";

const searchSchema = z.object({
  query: z.string().describe("The search terms for the music (e.g. genre, mood, keywords)"),
  bpm_min: z.number().optional().describe("Minimum BPM if the mood implies energy or tempo"),
  bpm_max: z.number().optional().describe("Maximum BPM"),
  genre_id: z.number().optional().describe("Deezer genre ID if applicable"),
  explanation: z.string().describe("Short explanation of why these parameters were chosen based on the vibe"),
});

export interface VibeResult {
  tracks: DeezerTrack[];
  explanation: string;
  params: z.infer<typeof searchSchema>;
}

export async function generateVibe(userPrompt: string): Promise<VibeResult> {
  // Use environment variable for model name, fallback to gemini-pro
  const modelName = process.env.GOOGLE_AI_MODEL || "gemini-pro";
  
  const { object } = await generateObject({
    model: google(modelName),
    schema: searchSchema,
    system: `You are a Vibe Agent for Deezer. Your goal is to translate abstract user moods and descriptions into technical search parameters for the Deezer API.
    
    The Deezer API supports advanced search queries like 'bpm_min', 'bpm_max'.
    
    Analyze the user's request (e.g., "Late night focus, synthwave, no lyrics").
    Extract keywords for the 'query' field (e.g. "Synthwave Instrumental").
    Estimate BPM range if mentioned (e.g. "fast" -> 130+, "chill" -> 80-110).
    
    Provide a 'query' string that combines the best keywords.
    Provide an 'explanation' for the user.
    `,
    prompt: userPrompt,
  });

  const tracks = await searchDeezerTracks({
    query: object.query,
    bpm_min: object.bpm_min,
    bpm_max: object.bpm_max,
    genre_id: object.genre_id,
    limit: 15,
  });

  return {
    tracks,
    explanation: object.explanation,
    params: object,
  };
}

