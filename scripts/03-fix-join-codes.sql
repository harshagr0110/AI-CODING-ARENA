-- Step 1: Add join_code column as nullable first
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS join_code VARCHAR(8);

-- Step 2: Generate join codes for existing rooms
UPDATE rooms 
SET join_code = UPPER(SUBSTRING(MD5(RANDOM()::text || id::text), 1, 6))
WHERE join_code IS NULL;

-- Step 3: Ensure all join codes are unique
DO $$
DECLARE
    room_record RECORD;
    new_code VARCHAR(8);
    code_exists BOOLEAN;
BEGIN
    -- Check for duplicate join codes and fix them
    FOR room_record IN 
        SELECT id, join_code 
        FROM rooms 
        WHERE join_code IN (
            SELECT join_code 
            FROM rooms 
            GROUP BY join_code 
            HAVING COUNT(*) > 1
        )
    LOOP
        -- Generate a new unique code
        LOOP
            new_code := UPPER(SUBSTRING(MD5(RANDOM()::text || room_record.id::text), 1, 6));
            
            SELECT EXISTS(SELECT 1 FROM rooms WHERE join_code = new_code) INTO code_exists;
            
            IF NOT code_exists THEN
                EXIT;
            END IF;
        END LOOP;
        
        -- Update the room with the new code
        UPDATE rooms SET join_code = new_code WHERE id = room_record.id;
    END LOOP;
END $$;

-- Step 4: Add unique constraint
ALTER TABLE rooms ADD CONSTRAINT rooms_join_code_unique UNIQUE (join_code);

-- Step 5: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rooms_join_code ON rooms(join_code);
