
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface PendingOffer {
  id: string
  title: string
  description: string
  hours: number
  timeCredits?: number
  user: {
    id: string
    name: string
    avatar: string
  }
  status: string
  isApplied?: boolean
  applicationStatus?: string
}

export const usePendingOffers = () => {
  const queryClient = useQueryClient()
  
  // Set up real-time subscriptions for any changes to offer_applications
  useEffect(() => {
    const applicationsChannel = supabase
      .channel('pending-applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offer_applications'
        },
        (payload) => {
          console.log('Applications changed:', payload)
          queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
        }
      )
      .subscribe()
      
    // Listen for transactions which indicate completed offers
    const transactionsChannel = supabase
      .channel('pending-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Transactions changed:', payload)
          queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
          queryClient.invalidateQueries({ queryKey: ['completed-offers'] })
        }
      )
      .subscribe()
      
    // Listen for offer status changes
    const offersChannel = supabase
      .channel('pending-offers-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers'
        },
        (payload) => {
          console.log('Offers changed:', payload)
          queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()
      
    return () => {
      supabase.removeChannel(applicationsChannel)
      supabase.removeChannel(transactionsChannel)
      supabase.removeChannel(offersChannel)
    }
  }, [queryClient])

  const { data, isLoading } = useQuery({
    queryKey: ['pending-offers-and-applications'],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      console.log('Fetching pending offers and applications for user:', user.id)

      // Get only pending and booked offers (exclude completed ones)
      const { data: pendingOffersData, error: pendingError } = await supabase
        .from('offers')
        .select(`
          *,
          profiles!offers_profile_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .in('status', ['pending', 'booked', 'available'])  // Only get non-completed offers
        .eq('profile_id', user.id)
      
      if (pendingError) {
        console.error('Error fetching pending offers:', pendingError)
        throw pendingError
      }
      
      console.log('Pending offers fetched:', pendingOffersData?.length || 0)

      // Get non-completed offers the user has applied to
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('offer_applications')
        .select(`
          *,
          offers (
            *,
            profiles!offers_profile_id_fkey (
              id,
              username,
              avatar_url
            )
          )
        `)
        .eq('applicant_id', user.id)
      
      if (applicationsError) {
        console.error('Error fetching applications:', applicationsError)
        throw applicationsError
      }
      
      console.log('Applications fetched:', applicationsData?.length || 0)
      
      // Filter out applications for completed offers
      const activeApplications = applicationsData.filter(app => 
        app.offers && app.offers.status !== 'completed'
      );

      console.log('Active applications found:', activeApplications.length)

      // Transform pending offers
      const pendingOffers = pendingOffersData?.map(offer => ({
        id: offer.id,
        title: offer.title,
        description: offer.description,
        hours: offer.hours,
        timeCredits: offer.time_credits,
        status: offer.status,
        isApplied: false,
        user: {
          id: offer.profiles?.id || '',
          name: offer.profiles?.username || 'Unknown User',
          avatar: offer.profiles?.avatar_url || '/placeholder.svg'
        }
      })) || [];

      // Transform applied offers
      const appliedOffers = activeApplications.map(application => {
        const offer = application.offers;
        if (!offer) return null; // Skip if offer is null
        
        return {
          id: offer.id,
          title: offer.title,
          description: offer.description,
          hours: offer.hours,
          timeCredits: offer.time_credits,
          status: offer.status,
          isApplied: true,
          applicationStatus: application.status,
          user: {
            id: offer.profiles?.id || '',
            name: offer.profiles?.username || 'Unknown User',
            avatar: offer.profiles?.avatar_url || '/placeholder.svg'
          }
        };
      }).filter(Boolean); // Remove nulls

      console.log('Total offers to display in My Offers & Applications:', 
                 pendingOffers.length + appliedOffers.length)

      // Combine both types of offers
      return [...pendingOffers, ...appliedOffers] as PendingOffer[]
    }
  })

  return {
    pendingOffers: data,
    isLoading
  }
}
