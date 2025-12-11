    create table playlists (
      id uuid default gen_random_uuid() primary key,
      user_id text not null,
      title text not null,
      tracks jsonb,
      tags text[],
      vibe_metrics jsonb,
      deezer_link text,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );