
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export const useCompleteOffer = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const completeOffer = useMutation({
    mutationFn: async (offerId: string) => {
      console.log("Completing offer:", offerId)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // First get the offer to verify ownership and get details
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .select('profile_id, time_credits, service_type')
        .eq('id', offerId)
        .single()
      
      if (offerError) {
        console.error("Error fetching offer:", offerError)
        throw offerError
      }
      
      // Verify the current user is the offer owner
      if (offer.profile_id !== user.id) {
        throw new Error('Only the offer owner can mark it as completed')
      }
      
      // Get the accepted applicant
      const { data: acceptedApplication, error: applicationError } = await supabase
        .from('offer_applications')
        .select('applicant_id')
        .eq('offer_id', offerId)
        .eq('status', 'accepted')
        .maybeSingle()
      
      if (applicationError) {
        console.error("Error fetching accepted application:", applicationError)
        throw applicationError
      }
      
      if (!acceptedApplication) {
        throw new Error('No accepted application found for this offer')
      }
      
      console.log("Accepted application found:", acceptedApplication)
      
      // Update the offer status to completed
      const { error: updateError } = await supabase
        .from('offers')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
      
      if (updateError) {
        console.error("Error updating offer status:", updateError)
        throw updateError
      }
      
      console.log("Offer marked as completed, creating transaction record")
      
      // Create a transaction record (but don't transfer credits yet - provider needs to claim them)
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          service: offer.service_type || 'Time Exchange',
          hours: offer.time_credits || 1,
          user_id: user.id,  // Requester
          provider_id: acceptedApplication.applicant_id,  // Service provider
          offer_id: offerId,
          claimed: false  // Start as unclaimed
        })
        .select()
        .single()
      
      if (transactionError) {
        console.error("Error creating transaction:", transactionError)
        throw transactionError
      }

      console.log("Transaction created successfully:", transaction)

      return {
        success: true,
        providerId: acceptedApplication.applicant_id,
        credits: offer.time_credits || 1
      }
    },
    onSuccess: (result) => {
      toast({
        title: "Success",
        description: `Offer marked as completed. The service provider can now claim ${result.credits} credits.`,
      })
      
      // Invalidate all relevant queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['user-offers'] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['time-balance'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['completed-offers'] })
      queryClient.invalidateQueries({ queryKey: ['completed-offers', undefined, 'for-you'] })
      queryClient.invalidateQueries({ queryKey: ['completed-offers', undefined, 'by-you'] })
      queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
    },
    onError: (error: Error) => {
      console.error("Error completing offer:", error)
      toast({
        title: "Error",
        description: `Failed to complete offer: ${error.message}`,
        variant: "destructive",
      })
    }
  })

  return {
    completeOffer: completeOffer.mutate,
    isCompleting: completeOffer.isPending
  }
}
