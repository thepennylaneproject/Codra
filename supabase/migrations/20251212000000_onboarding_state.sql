-- Add onboarding_state to profiles table (renamed from user_profiles to match schema)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_state JSONB DEFAULT '{}'::jsonb;
