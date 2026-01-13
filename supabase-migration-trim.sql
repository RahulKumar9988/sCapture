
-- Add comment for documentation
COMMENT ON COLUMN videos.trim_start IS 'Start time in seconds for trimmed playback';
COMMENT ON COLUMN videos.trim_end IS 'End time in seconds for trimmed playback (NULL = play to end)';
