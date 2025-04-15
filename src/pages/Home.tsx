
import HomeHeader from "@/components/home/HomeHeader"
import PendingOffers from "@/components/home/PendingOffers"
import QuickStats from "@/components/home/QuickStats"
import { useOfferSubscription } from "@/hooks/useOfferSubscription"
import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

const Home = () => {
  // Set up global subscription for real-time updates
  useOfferSubscription()
  
  // Force refetch of time balance when the home page loads
  const queryClient = useQueryClient()
  
  useEffect(() => {
    // Trigger a refetch of all important data when the home page loads
    queryClient.invalidateQueries({ queryKey: ['time-balance'] })
    queryClient.refetchQueries({ queryKey: ['time-balance'] })
    
    queryClient.invalidateQueries({ queryKey: ['completed-offers'] })
    queryClient.refetchQueries({ queryKey: ['completed-offers'] })
    
    queryClient.invalidateQueries({ queryKey: ['user-stats'] })
    queryClient.refetchQueries({ queryKey: ['user-stats'] })
  }, [queryClient])
  
  return (
    <div className="container mx-auto p-6">
      <HomeHeader />
      <QuickStats />
      <div className="space-y-6">
        <PendingOffers />
      </div>
    </div>
  )
}

export default Home
