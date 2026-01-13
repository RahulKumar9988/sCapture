-- Create Videos Table
create table videos (
  id uuid primary key,
  title text,
  filename text,
  views int default 0,
  completion_rate float default 0,
  trim_start float default 0,
  trim_end float default null,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table videos enable row level security;

-- Allow Public Read Access (so anyone can watch videos)
create policy "Public Videos are viewable by everyone"
  on videos for select
  using ( true );

-- Allow Public Insert Access (so anyone can upload without login for this MVP)
-- WARNING: In a real app, you should restrict this to authenticated users!
create policy "Public can insert videos"
  on videos for insert
  with check ( true ); 
  
-- Allow Public Update Access (for view counts and completion rates)
create policy "Public can update videos"
  on videos for update
  using ( true );
  
-- Optional: Create View Counter Function (for the View API to work perfectly)
create or replace function increment_video_view(video_id uuid)
returns void as $$
begin   
  update videos
  set views = views + 1
  where id = video_id;
end;
$$ language plpgsql;

-- Add comment for documentation
COMMENT ON COLUMN videos.trim_start IS 'Start time in seconds for trimmed playback';
COMMENT ON COLUMN videos.trim_end IS 'End time in seconds for trimmed playback (NULL = play to end)';
