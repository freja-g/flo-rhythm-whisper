-- Enable Row Level Security on cycles table
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

-- Create policies for cycles table
CREATE POLICY "Users can view their own cycles" 
ON public.cycles 
FOR SELECT 
USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can create their own cycles" 
ON public.cycles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update their own cycles" 
ON public.cycles 
FOR UPDATE 
USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can delete their own cycles" 
ON public.cycles 
FOR DELETE 
USING (auth.uid() = user_id::uuid);

-- Enable Row Level Security on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Enable Row Level Security on symptoms table
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;

-- Create policies for symptoms table
CREATE POLICY "Users can view their own symptoms" 
ON public.symptoms 
FOR SELECT 
USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can create their own symptoms" 
ON public.symptoms 
FOR INSERT 
WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update their own symptoms" 
ON public.symptoms 
FOR UPDATE 
USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can delete their own symptoms" 
ON public.symptoms 
FOR DELETE 
USING (auth.uid() = user_id::uuid);