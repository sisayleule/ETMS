-- =====================================================================================================================
-- SAFE TRIP JOURNAL MIGRATION (Handles existing data gracefully)
-- =====================================================================================================================

-- Step 1: Disable RLS temporarily to avoid policy conflicts during migration
ALTER TABLE trip_journal DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop old RLS policies (if they exist)
DROP POLICY IF EXISTS "Students can view own activity log" ON trip_journal;
DROP POLICY IF EXISTS "Department heads can view all activities" ON trip_journal;

-- Step 3: Add new columns (only if they don't exist)
DO $$ 
BEGIN
    -- Add title column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trip_journal' AND column_name='title') THEN
        ALTER TABLE trip_journal ADD COLUMN title TEXT;
    END IF;
    
    -- Add content column (migrate from description if it exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trip_journal' AND column_name='content') THEN
        ALTER TABLE trip_journal ADD COLUMN content TEXT;
        -- Copy data from description to content if description exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trip_journal' AND column_name='description') THEN
            UPDATE trip_journal SET content = COALESCE(description, '');
        END IF;
        -- Now make content NOT NULL with default
        ALTER TABLE trip_journal ALTER COLUMN content SET DEFAULT '';
        ALTER TABLE trip_journal ALTER COLUMN content SET NOT NULL;
    END IF;
    
    -- Add entry_date column (derive from created_at if needed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trip_journal' AND column_name='entry_date') THEN
        ALTER TABLE trip_journal ADD COLUMN entry_date DATE;
        -- Set entry_date from created_at for existing rows
        UPDATE trip_journal SET entry_date = created_at::DATE WHERE entry_date IS NULL;
        -- Set default and NOT NULL
        ALTER TABLE trip_journal ALTER COLUMN entry_date SET DEFAULT CURRENT_DATE;
        ALTER TABLE trip_journal ALTER COLUMN entry_date SET NOT NULL;
    END IF;
    
    -- Add mood column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trip_journal' AND column_name='mood') THEN
        ALTER TABLE trip_journal ADD COLUMN mood TEXT;
    END IF;
    
    -- Add photo_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trip_journal' AND column_name='photo_url') THEN
        ALTER TABLE trip_journal ADD COLUMN photo_url TEXT;
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trip_journal' AND column_name='updated_at') THEN
        ALTER TABLE trip_journal ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Step 4: Drop old columns (only if new columns exist and have data)
DO $$ 
BEGIN
    -- Only drop old columns if new schema is in place
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trip_journal' AND column_name='content') THEN
        -- Drop action_type if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trip_journal' AND column_name='action_type') THEN
            ALTER TABLE trip_journal DROP COLUMN action_type;
        END IF;
        
        -- Drop description if it exists (data already copied to content)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trip_journal' AND column_name='description') THEN
            ALTER TABLE trip_journal DROP COLUMN description;
        END IF;
        
        -- Drop points_awarded if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trip_journal' AND column_name='points_awarded') THEN
            ALTER TABLE trip_journal DROP COLUMN points_awarded;
        END IF;
    END IF;
END $$;

-- Step 5: Re-enable RLS
ALTER TABLE trip_journal ENABLE ROW LEVEL SECURITY;

-- Step 6: Create new RLS policies (student-only access)
CREATE POLICY "Students can view own journal entries" ON trip_journal
  FOR SELECT 
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create own journal entries" ON trip_journal
  FOR INSERT 
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own journal entries" ON trip_journal
  FOR UPDATE 
  USING (auth.uid() = student_id);

CREATE POLICY "Students can delete own journal entries" ON trip_journal
  FOR DELETE 
  USING (auth.uid() = student_id);

-- Step 7: Verification Query
SELECT 
  'Migration Complete!' as status,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'trip_journal';

-- Show the new policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'trip_journal'
ORDER BY policyname;

-- Show the new columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'trip_journal'
ORDER BY ordinal_position;
