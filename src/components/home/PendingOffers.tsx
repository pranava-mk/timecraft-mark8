
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
      <Card>
        <CardHeader>
          <CardTitle>My Offers & Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!pendingOffers || pendingOffers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Offers & Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No pending offers or applications found
          </p>
        </CardContent>
      </Card>
    )
  }

  console.log('Pending offers to render:', pendingOffers.length)
  
  // Group offers by type (my offers vs applied offers)
  const myOffers = pendingOffers.filter(offer => !offer.isApplied)
  const appliedOffers = pendingOffers.filter(offer => offer.isApplied)
  
  console.log('My offers count:', myOffers.length)
  console.log('Applied offers count:', appliedOffers.length)

  return (
    <Card className="gradient-border card-hover">
      <CardHeader>
        <CardTitle className="text-navy">My Offers & Applications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {myOffers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">My Pending Offers</h3>
              <div className="space-y-4">
                {myOffers.map((offer) => (
                  <OfferCard 
                    key={offer.id} 
                    offer={offer}
                  />
                ))}
              </div>
            </div>
          )}
          
          {appliedOffers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">My Applications</h3>
              <div className="space-y-4">
                {appliedOffers.map((offer) => (
                  <OfferCard 
                    key={offer.id}
                    offer={offer}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PendingOffers
