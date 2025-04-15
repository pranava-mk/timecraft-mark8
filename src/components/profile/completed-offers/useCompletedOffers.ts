
import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export interface CompletedOffer {
  id: string
  title: string
  description: string
  service_type: string
  time_credits: number
  hours: number
  created_at: string
  provider_username?: string
  claimed?: boolean
}

export function useCompletedOffers(userId: string | null) {
  const queryClient = useQueryClient()
  const [localClaimed, setLocalClaimed] = useState<Record<string, boolean>>({})
  
  // Set up real-time subscription for transactions
  useEffect(() => {
    if (!userId) return
    
    const transactionsChannel = supabase
      .channel('completed-offers-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Transaction update in CompletedOffers:', payload)
          queryClient.invalidateQueries({ queryKey: ['completed-offers'] })
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
          queryClient.refetchQueries({ queryKey: ['completed-offers'] })
          queryClient.refetchQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()
      
    return () => {
      supabase.removeChannel(transactionsChannel)
    }
  }, [userId, queryClient])
  
  // Fetch offers completed FOR the user (user made the request)
  const { data: completedForYou, isLoading: forYouLoading } = useQuery({
    queryKey: ['completed-offers', userId, 'for-you'],
    queryFn: async () => {
      if (!userId) return []
      
      // Get transactions where user requested the service
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          service,
          hours,
          created_at,
          provider_id,
          offer_id,
          claimed
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching completed offers for you:', error)
        throw error
      }

      // For each transaction, get the offer and provider details
      const offerDetails = await Promise.all(
        data.map(async (transaction) => {
          try {
            if (!transaction.offer_id) return null
            
            // Fetch offer details
            const { data: offerData, error: offerError } = await supabase
              .from('offers')
              .select('title, description, time_credits, service_type')
              .eq('id', transaction.offer_id)
              .maybeSingle()
              
            if (offerError) {
              console.error('Error fetching offer details:', offerError)
              return null
            }
            
            if (!offerData) return null
            
            // Fetch provider username
            const { data: providerData, error: providerError } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', transaction.provider_id)
              .maybeSingle()
              
            if (providerError) {
              console.error('Error fetching provider username:', providerError)
              return null
            }
            
            return {
              id: transaction.id,
              title: offerData.title || 'Untitled',
              description: offerData.description || 'No description',
              service_type: offerData.service_type || transaction.service,
              time_credits: offerData.time_credits || 0,
              hours: transaction.hours,
              created_at: transaction.created_at,
              provider_username: providerData?.username || 'Unknown',
              claimed: transaction.claimed || false
            }
          } catch (err) {
            console.error('Error processing transaction:', err)
            return null
          }
        })
      )

      // Filter out nulls and remove duplicates
      const validOffers = offerDetails.filter(Boolean) as CompletedOffer[]
      
      // Update the local claimed state
      validOffers.forEach(offer => {
        if (offer.claimed) {
          setLocalClaimed(prev => ({ ...prev, [offer.id]: true }))
        }
      })
      
      return validOffers
    },
    enabled: !!userId,
    refetchInterval: 10000 // Refetch every 10 seconds to ensure updated data
  })

  // Function to mark an offer as claimed locally (optimistic UI update)
  const setOfferAsClaimed = (offerId: string) => {
    setLocalClaimed(prev => ({ ...prev, [offerId]: true }))
    // Also invalidate the time-balance query to ensure it's up to date
    queryClient.invalidateQueries({ queryKey: ['time-balance'] })
    queryClient.refetchQueries({ queryKey: ['time-balance'] })
  }

  return {
    completedForYou,
    forYouLoading,
    localClaimed,
    setOfferAsClaimed
  }
}
