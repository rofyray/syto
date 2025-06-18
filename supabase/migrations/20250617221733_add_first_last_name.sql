/*
  # Add First Name and Last Name to Profiles
  
  This migration adds first_name and last_name columns to the profiles table
  to replace the single 'Full Name' field from the signup form.
*/

-- Add first_name and last_name columns to profiles table
ALTER TABLE profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update existing profiles to split username into first_name and last_name if needed
-- This is a one-time data migration for existing users
UPDATE profiles 
SET 
  first_name = CASE 
    WHEN position(' ' in username) > 0 
    THEN split_part(username, ' ', 1)
    ELSE username
  END,
  last_name = CASE 
    WHEN position(' ' in username) > 0 
    THEN substring(username from position(' ' in username) + 1)
    ELSE ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Make first_name required (NOT NULL) after data migration
ALTER TABLE profiles 
ALTER COLUMN first_name SET NOT NULL;

-- last_name can be optional (some people have single names)
-- ALTER COLUMN last_name SET NOT NULL; -- Commented out to allow single names
