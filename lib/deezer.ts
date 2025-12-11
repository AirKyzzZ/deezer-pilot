export interface DeezerTrack {
  id: number;
  title: string;
  title_short: string;
  link: string;
  duration: number;
  rank: number;
  explicit_lyrics: boolean;
  preview: string;
  artist: {
    id: number;
    name: string;
    link: string;
    picture: string;
    picture_small: string;
    picture_medium: string;
    picture_big: string;
    picture_xl: string;
  };
  album: {
    id: number;
    title: string;
    cover: string;
    cover_small: string;
    cover_medium: string;
    cover_big: string;
    cover_xl: string;
  };
}

export interface DeezerSearchResponse {
  data: DeezerTrack[];
  total: number;
  next?: string;
}

export interface SearchParams {
  query: string;
  bpm_min?: number;
  bpm_max?: number;
  genre_id?: number;
  limit?: number;
}

const DEEZER_API_URL = "https://api.deezer.com";

export async function searchDeezerTracks(params: SearchParams): Promise<DeezerTrack[]> {
  // Construct advanced query
  // Example: q=track:"something" bpm_min:120
  // Note: Deezer API advanced search is sometimes strict.
  // We will combine the natural language query with filters.
  
  const parts = [];
  if (params.query) parts.push(params.query);
  
  // Advanced operators must be part of the 'q' parameter or handled specifically if the endpoint supports separate params.
  // The standard /search endpoint takes 'q'.
  // We append filters to the query string if provided.
  
  if (params.bpm_min) parts.push(`bpm_min:${params.bpm_min}`);
  if (params.bpm_max) parts.push(`bpm_max:${params.bpm_max}`);
  
  // Genre filtering in Deezer is often better done by post-filtering or specific endpoints, 
  // but let's try appending if the API supports it in q, or just rely on the text query.
  // The user prompt suggests advanced queries like bpm_min exist.
  
  const queryString = parts.join(" ");
  
  const url = new URL(`${DEEZER_API_URL}/search`);
  url.searchParams.set("q", queryString);
  url.searchParams.set("limit", (params.limit || 15).toString());
  
  const res = await fetch(url.toString());
  
  if (!res.ok) {
    throw new Error(`Deezer API error: ${res.statusText}`);
  }
  
  const data = (await res.json()) as DeezerSearchResponse;
  return data.data;
}

export async function createPlaylist(title: string, accessToken: string) {
  // POST /user/me/playlists
  const url = new URL(`${DEEZER_API_URL}/user/me/playlists`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("title", title);
  
  const res = await fetch(url.toString(), {
    method: "POST",
  });
  
  if (!res.ok) {
    throw new Error(`Failed to create playlist: ${res.statusText}`);
  }
  
  return await res.json();
}

export async function addTracksToPlaylist(playlistId: number, trackIds: number[], accessToken: string) {
  // POST /playlist/{id}/tracks
  const url = new URL(`${DEEZER_API_URL}/playlist/${playlistId}/tracks`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("songs", trackIds.join(","));
  
  const res = await fetch(url.toString(), {
    method: "POST",
  });
  
  if (!res.ok) {
    throw new Error(`Failed to add tracks: ${res.statusText}`);
  }
  
  return await res.json();
}

