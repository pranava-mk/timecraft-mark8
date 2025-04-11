
-- Add RLS policies for the transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to view transactions where they are either the requester or provider
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = provider_id);

-- Allow users to update transactions where they are the provider (for claiming)
CREATE POLICY "Providers can update transactions to claim credits" 
ON public.transactions 
FOR UPDATE 
USING (auth.uid() = provider_id);
