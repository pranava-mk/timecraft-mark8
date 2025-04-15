
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export const useClaimCredits = () => {
  const [isClaimed, setIsClaimed] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const claimCredits = useMutation({
    mutationFn: async ({ offerId, hours }: { offerId: string, hours: number }) => {
      console.log(`Claiming ${hours} credits for offer ${offerId}`)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw new Error(`Authentication error: ${userError.message}`)
      if (!user) throw new Error('User not authenticated')

      // First check if the transaction exists and if it's already claimed
      const { data: existingTransaction, error: txError } = await supabase
        .from('transactions')
        .select('claimed, provider_id')
        .eq('offer_id', offerId)
        .single()

      if (txError && txError.code !== 'PGRST116') { // PGRST116 is "No rows returned" which is fine
        throw new Error(`Error checking transaction: ${txError.message}`)
      }

      // Verify the current user is the provider
      if (existingTransaction && existingTransaction.provider_id !== user.id) {
        throw new Error('You are not authorized to claim these credits')
      }

      // Check if already claimed
      if (existingTransaction && existingTransaction.claimed) {
        setIsClaimed(true)
        return { alreadyClaimed: true }
      }

      try {
        // If transaction doesn't exist yet, create it
        if (!existingTransaction) {
          // Get the offer details to get the request owner
          const { data: offerData, error: offerError } = await supabase
            .from('offers')
            .select('profile_id, service_type')
            .eq('id', offerId)
            .single()
            
          if (offerError) throw new Error(`Error getting offer details: ${offerError.message}`)
          
          // Create the transaction
          const { error: createError } = await supabase
            .from('transactions')
            .insert({
              service: offerData.service_type || 'service',
              hours: hours,
              user_id: offerData.profile_id,
              provider_id: user.id,
              offer_id: offerId,
              claimed: true
            })
            
          if (createError) throw new Error(`Error creating transaction: ${createError.message}`)
        } else {
          // Update the transaction to mark as claimed
          const { error: updateError } = await supabase
            .from('transactions')
            .update({ claimed: true })
            .eq('offer_id', offerId)
            .eq('provider_id', user.id)

          if (updateError) throw new Error(`Error updating transaction: ${updateError.message}`)
        }

        // Update the user's time balance directly
        const { data: currentBalance, error: balanceError } = await supabase
          .from('time_balances')
          .select('balance')
          .eq('user_id', user.id)
          .single()

        if (balanceError) throw new Error(`Error getting current balance: ${balanceError.message}`)

        const newBalance = currentBalance.balance + hours
        
        const { error: updateBalanceError } = await supabase
          .from('time_balances')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateBalanceError) throw new Error(`Error updating balance: ${updateBalanceError.message}`)

        console.log(`Successfully updated balance from ${currentBalance.balance} to ${newBalance}`)
        
        setIsClaimed(true)
        return { success: true, creditsClaimed: hours }
      } catch (error) {
        console.error("Error in claimCredits:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.alreadyClaimed) {
        toast({
          title: "Already Claimed",
          description: "These credits have already been claimed.",
        })
      } else {
        toast({
          title: "Success",
          description: `You have claimed ${data.creditsClaimed} credits!`,
        })
      }
      
      // Invalidate ALL relevant queries to ensure UI updates correctly
      queryClient.invalidateQueries({ queryKey: ['time-balance'] })
      queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['user-offers'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      
      // Also trigger a direct refetch of the time balance to ensure it's updated immediately
      queryClient.refetchQueries({ queryKey: ['time-balance'] })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    }
  })

  return {
    claimCredits: claimCredits.mutate,
    isClaiming: claimCredits.isPending,
    isClaimed
  }
}
