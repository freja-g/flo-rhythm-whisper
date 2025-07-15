-- Temporarily disable RLS policies to allow local storage usage
-- This will be re-enabled when authentication is implemented

ALTER TABLE public.cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;  
ALTER TABLE public.symptoms DISABLE ROW LEVEL SECURITY;