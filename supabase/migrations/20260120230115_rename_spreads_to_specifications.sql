-- Rename table
ALTER TABLE spreads RENAME TO specifications;

-- Rename policies if they exist (good practice to keep names consistent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own spreads') THEN
        ALTER POLICY "Users can view their own spreads" ON specifications RENAME TO "Users can view their own specifications";
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own spreads') THEN
        ALTER POLICY "Users can insert their own spreads" ON specifications RENAME TO "Users can insert their own specifications";
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own spreads') THEN
        ALTER POLICY "Users can update their own spreads" ON specifications RENAME TO "Users can update their own specifications";
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own spreads') THEN
        ALTER POLICY "Users can delete their own spreads" ON specifications RENAME TO "Users can delete their own specifications";
    END IF;
END
$$;
