
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export const useProfileData = () => {
  const queryClient = useQueryClient()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user?.id) {
        setUserId(data.user.id)
      }
    }
    
    fetchUserId()
  }, [])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        () => {
          console.log('Profile update received')
          queryClient.invalidateQueries({ queryKey: ['profile', userId] })
        }
      )
      .subscribe()

    const timeBalanceChannel = supabase
      .channel('profile-time-balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_balances',
          filter: `user_id=eq.${userId}`
        },
        () => {
          console.log('Time balance update received on profile page')
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
          queryClient.refetchQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()

    const offersChannel = supabase
      .channel('profile-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
          filter: `profile_id=eq.${userId}`
        },
        () => {
          console.log('Offers update received on profile page')
          queryClient.invalidateQueries({ queryKey: ['user-offers', userId] })
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
          queryClient.invalidateQueries({ queryKey: ['completed-offers', userId] })
        }
      )
      .subscribe()
      
    const transactionsChannel = supabase
      .channel('profile-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          console.log('Transactions update received on profile page')
          queryClient.invalidateQueries({ queryKey: ['completed-offers', userId] })
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
          queryClient.refetchQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(timeBalanceChannel)
      supabase.removeChannel(offersChannel)
      supabase.removeChannel(transactionsChannel)
    }
  }, [queryClient, userId])

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!userId
  })

  const { data: userOffers, isLoading: userOffersLoading } = useQuery({
    queryKey: ['user-offers', userId],
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('User offers in profile page:', data)
      return data
    },
    enabled: !!userId
  })

  // Get time balance directly from the database - single source of truth
  const { data: timeBalance, isLoading: timeBalanceLoading } = useQuery({
    queryKey: ['time-balance'],
    queryFn: async () => {
      if (!userId) return null
      
      const { data, error } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching time balance:', error)
        return 0
      }
      
      return data?.balance || 0
    },
    enabled: !!userId
  })

  // Filter out completed offers for the My Requests tab
  const activeUserOffers = userOffers?.filter(offer => offer.status !== 'completed') || []

  return {
    userId,
    profile,
    profileLoading,
    userOffers,
    userOffersLoading,
    timeBalance,
    timeBalanceLoading,
    activeUserOffers
  }
}
