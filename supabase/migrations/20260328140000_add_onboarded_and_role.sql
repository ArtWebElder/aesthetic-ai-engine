-- Add onboarded and role columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin'));

-- Set superadmin for the owner
UPDATE profiles SET role = 'superadmin' WHERE email = 'elderlucas.configu@gmail.com';
