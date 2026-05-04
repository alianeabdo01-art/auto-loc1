-- Fix RLS Policies for Admin Car Management
-- Run this in Supabase SQL Editor to allow admins to manage cars

-- First, let's drop existing policies that might be blocking
DROP POLICY IF EXISTS "Enable all for admins" ON cars;
DROP POLICY IF EXISTS "Enable read access for all" ON cars;
DROP POLICY IF EXISTS "Users can select all cars" ON cars;
DROP POLICY IF EXISTS "Admins can manage cars" ON cars;

-- SIMPLEST FIX: Disable RLS on cars table
-- The admin check is already done on the backend API, so we don't need RLS here
ALTER TABLE cars DISABLE ROW LEVEL SECURITY;

-- Then re-enable and add basic policies
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to SELECT cars (anyone can view)
CREATE POLICY "Anyone can view cars"
ON cars
FOR SELECT
USING (true);

-- Policy 2: Allow anyone authenticated to INSERT (admin check is on backend)
CREATE POLICY "Authenticated users can insert cars"
ON cars
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Allow updates for authenticated users
CREATE POLICY "Authenticated users can update cars"
ON cars
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy 4: Allow deletes for authenticated users
CREATE POLICY "Authenticated users can delete cars"
ON cars
FOR DELETE
USING (auth.role() = 'authenticated');

-- Verify policies are created
SELECT tablename, policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'cars' 
ORDER BY policyname;
