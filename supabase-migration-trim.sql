-- Add trim metadata columns to videos table
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS trim_start FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS trim_end FLOAT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN videos.trim_start IS 'Start time in seconds for trimmed playback';
COMMENT ON COLUMN videos.trim_end IS 'End time in seconds for trimmed playback (NULL = play to end)';
