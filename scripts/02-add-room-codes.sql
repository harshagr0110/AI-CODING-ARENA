-- Add join codes to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS join_code VARCHAR(8) UNIQUE;

-- Generate join codes for existing rooms (only if they don't have one)
UPDATE rooms SET join_code = UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 6)) WHERE join_code IS NULL;

-- Make join_code NOT NULL for future rooms (only if column exists and is populated)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'join_code') THEN
        ALTER TABLE rooms ALTER COLUMN join_code SET NOT NULL;
    END IF;
END $$;

-- Create index for faster lookups (only if column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'join_code') THEN
        CREATE INDEX IF NOT EXISTS idx_rooms_join_code ON rooms(join_code);
    END IF;
END $$;
