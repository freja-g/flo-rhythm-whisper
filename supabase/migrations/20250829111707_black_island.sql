/*
  # Enable Row Level Security on all tables

  1. Security Updates
    - Enable RLS on symptoms table (was missing)
    - Enable RLS on cycles table (was missing) 
    - Verify RLS is enabled on profiles table
    - Ensure all tables have proper security policies

  2. Data Integrity
    - Add constraints to ensure data quality
    - Add indexes for better performance
    - Update existing policies for consistency
*/

-- Enable RLS on symptoms table
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;

-- Enable RLS on cycles table  
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;

-- Ensure profiles table has RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Update symptoms table policies for consistency
DROP POLICY IF EXISTS "Deny all access by default" ON symptoms;
DROP POLICY IF EXISTS "Users can create their own symptoms" ON symptoms;
DROP POLICY IF EXISTS "Users can delete their own symptoms" ON symptoms;
DROP POLICY IF EXISTS "Users can manage their own symptoms" ON symptoms;
DROP POLICY IF EXISTS "Users can update their own symptoms" ON symptoms;
DROP POLICY IF EXISTS "Users can view their own symptoms" ON symptoms;

-- Create consistent policies for symptoms
CREATE POLICY "Users can manage their own symptoms"
  ON symptoms
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Update cycles table policies for consistency
DROP POLICY IF EXISTS "Users can create their own cycles" ON cycles;
DROP POLICY IF EXISTS "Users can delete their own cycles" ON cycles;
DROP POLICY IF EXISTS "Users can manage their own cycles" ON cycles;
DROP POLICY IF EXISTS "Users can update their own cycles" ON cycles;
DROP POLICY IF EXISTS "Users can view their own cycles" ON cycles;

-- Create consistent policies for cycles
CREATE POLICY "Users can manage their own cycles"
  ON cycles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add data validation constraints
DO $$
BEGIN
  -- Add check constraint for cycle length
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'cycles_cycle_length_check' 
    AND table_name = 'cycles'
  ) THEN
    ALTER TABLE cycles ADD CONSTRAINT cycles_cycle_length_check 
    CHECK (cycle_length >= 21 AND cycle_length <= 35);
  END IF;

  -- Add check constraint for period length
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'cycles_period_length_check' 
    AND table_name = 'cycles'
  ) THEN
    ALTER TABLE cycles ADD CONSTRAINT cycles_period_length_check 
    CHECK (period_length >= 3 AND period_length <= 10);
  END IF;

  -- Add check constraint for profile cycle length
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_cycle_length_check' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_cycle_length_check 
    CHECK (cycle_length IS NULL OR (cycle_length >= 21 AND cycle_length <= 35));
  END IF;

  -- Add check constraint for profile period length
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_period_length_check' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_period_length_check 
    CHECK (period_length IS NULL OR (period_length >= 3 AND period_length <= 10));
  END IF;
END $$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_symptoms_date ON symptoms(date);
CREATE INDEX IF NOT EXISTS idx_cycles_start_date ON cycles(start_date);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at);

-- Add updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();