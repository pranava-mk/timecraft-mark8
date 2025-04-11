
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePendingOffers } from "@/hooks/usePendingOffers"
import OfferCard from "../explore/OfferCard"
import { useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"

const PendingOffers = () => {
  const { pendingOffers, isLoading } = usePendingOffers()
  const queryClient = useQueryClient()

  // Set up real-time subscription for offer, application and transaction changes
  useEffect(() => {
    const offerChannel = supabase
      .channel('pending-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers'
        },
        (payload) => {
          console.log('Offer changed:', payload)
          queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()

    const applicationChannel = supabase
      .channel('applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offer_applications'
        },
        (payload) => {
          console.log('Application changed:', payload)
          queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
        }
      )
      .subscribe()
      
    const transactionChannel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Transaction changed:', payload)
          queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
          queryClient.invalidateQueries({ queryKey: ['completed-offers'] })
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
          queryClient.invalidateQueries({ queryKey: ['user-stats'] })
        }
      )
      .subscribe()
      
    const timeBalanceChannel = supabase
      .channel('time-balance-changes-home')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_balances'
        },
        (payload) => {
          console.log('Time balance changed:', payload)
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
          queryClient.invalidateQueries({ queryKey: ['user-stats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(offerChannel)
      supabase.removeChannel(applicationChannel)
      supabase.removeChannel(transactionChannel)
      supabase.removeChannel(timeBalanceChannel)
    }
  }, [queryClient])

  if (isLoading) {
    return (
      <Card className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl">
        <CardHeader>
          <CardTitle className="text-navy">My Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading...</div>
        </CardContent>
      </Card>
    )
  }

  // Only get applied offers
  const appliedOffers = pendingOffers ? pendingOffers.filter(offer => offer.isApplied) : []

  if (!appliedOffers || appliedOffers.length === 0) {
    return (
      <Card className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl">
        <CardHeader>
          <CardTitle className="text-navy">My Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No pending applications found
          </p>
        </CardContent>
      </Card>
    )
  }

  console.log('Applied offers count:', appliedOffers.length)

  return (
    <Card className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl">
      <CardHeader>
        <CardTitle className="text-navy">My Applications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appliedOffers.map((offer) => (
            <OfferCard 
              key={offer.id}
              offer={offer}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default PendingOffers
