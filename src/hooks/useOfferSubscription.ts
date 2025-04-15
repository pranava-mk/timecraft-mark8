
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export const useOfferSubscription = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
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
        }
      )
      .subscribe()

    const timeBalancesChannel = supabase
      .channel('time-balances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_balances'
        },
        () => {
          console.log('Time balance change detected')
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()

    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          console.log('Transaction change detected')
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
          queryClient.invalidateQueries({ queryKey: ['transactions'] })
          queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(timeBalancesChannel)
      supabase.removeChannel(transactionsChannel)
    }
  }, [queryClient])
}
