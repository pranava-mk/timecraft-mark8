
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export const useOfferSubscription = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Get current user - needed for subscription filters
    const getCurrentUserId = async () => {
      const { data } = await supabase.auth.getUser()
      return data.user?.id
    }

    // Channel for offers changes
    const channel = supabase
      .channel('offer-management')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers'
        },
        () => {
          console.log('Offer change detected')
          queryClient.invalidateQueries({ queryKey: ['offers'] })
          queryClient.invalidateQueries({ queryKey: ['user-offers'] })
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
          queryClient.invalidateQueries({ queryKey: ['user-stats'] })
          
          // Force immediate refetch of time balance
          queryClient.refetchQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()

    // Channel for time balances changes
    const timeBalancesChannel = supabase
      .channel('time-balances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_balances'
        },
        (payload) => {
          console.log('Time balance change detected', payload)
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
          // Force immediate refetch of time balance
          queryClient.refetchQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()

    // Channel for transactions changes
    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Transaction change detected', payload)
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
          queryClient.invalidateQueries({ queryKey: ['transactions'] })
          queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
          queryClient.invalidateQueries({ queryKey: ['completed-offers'] })
          
          // Force immediate refetch
          queryClient.refetchQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()

    // Set up a user-specific subscription once we have the user ID
    getCurrentUserId().then(userId => {
      if (!userId) return
      
      // User-specific time balance changes
      const userTimeBalanceChannel = supabase
        .channel('user-time-balance-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'time_balances',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('User time balance change detected', payload)
            queryClient.invalidateQueries({ queryKey: ['time-balance'] })
            queryClient.refetchQueries({ queryKey: ['time-balance'] })
          }
        )
        .subscribe()
        
      return () => {
        supabase.removeChannel(userTimeBalanceChannel)
      }
    })

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(timeBalancesChannel)
      supabase.removeChannel(transactionsChannel)
    }
  }, [queryClient])
}
