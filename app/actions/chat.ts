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
    
    CRITICAL RULES FOR QUERY CONSTRUCTION:
    1. ALWAYS include artist names when mentioned - they are the most important search terms
    2. For "songs like X" or "similar to X" queries, use the artist name as the primary search term
    3. For "discover more [genre] like [artist]" queries, prioritize the artist name, then add genre
    4. Keep queries to 2-4 words maximum - Deezer search works best with concise queries
    5. Remove filler words like "songs", "music", "tracks", "like", "similar", "discover", "more"
    6. If both artist and genre are mentioned, put artist first: "artist genre" format
    
    QUERY EXAMPLES:
    - "Japanese rock" -> query: "Japanese rock"
    - "hyperpop songs like glaive" -> query: "glaive hyperpop" (artist first!)
    - "I want to discover more hyperpop songs like the artist glaive" -> query: "glaive hyperpop"
    - "songs similar to glaive" -> query: "glaive"
    - "late night focus, synthwave" -> query: "synthwave instrumental"
    - "more hyperpop like glaive" -> query: "glaive hyperpop"
    
    The Deezer API supports advanced search queries like 'bpm_min', 'bpm_max'.
    Estimate BPM range if mentioned (e.g. "fast" -> 130+, "chill" -> 80-110).
    
    Always provide a clear 'explanation' that explains your search strategy and what you extracted from the user's request.
    `,
    prompt: userPrompt,
  });

  console.log("Generated search params:", object);

  let tracks: DeezerTrack[] = [];
  
  try {
    tracks = await searchDeezerTracks({
      query: object.query,
      bpm_min: object.bpm_min,
      bpm_max: object.bpm_max,
      genre_id: object.genre_id,
      limit: 15,
    });
    
    // If no results, try a simpler query (fallback strategy)
    if (tracks.length === 0 && object.query) {
      console.log("No results with complex query, trying simplified query...");
      // Extract just the main keywords (first 2-3 words)
      const simplifiedQuery = object.query.split(" ").slice(0, 3).join(" ");
      tracks = await searchDeezerTracks({
        query: simplifiedQuery,
        limit: 15,
      });
      
      if (tracks.length > 0) {
        object.explanation = `${object.explanation} (Used simplified search: "${simplifiedQuery}")`;
      }
    }
  } catch (error) {
    console.error("Deezer API error:", error);
    // Return empty tracks but keep the explanation
    tracks = [];
  }

  return {
    tracks,
    explanation: object.explanation,
    params: object,
  };
}

