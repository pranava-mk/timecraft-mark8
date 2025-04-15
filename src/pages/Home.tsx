
import HomeHeader from "@/components/home/HomeHeader"
import PendingOffers from "@/components/home/PendingOffers"
import QuickStats from "@/components/home/QuickStats"
import { useOfferSubscription } from "@/hooks/useOfferSubscription"

const Home = () => {
  // Set up global subscription for real-time updates
  useOfferSubscription()
  
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
