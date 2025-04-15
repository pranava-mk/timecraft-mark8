
import { useCompletedOffers } from "./useCompletedOffers"
import CompletedOffersList from "./CompletedOffersList"

interface CompletedOffersProps {
  userId: string | null
  username?: string
  avatar?: string
}

const CompletedOffers = ({ userId }: CompletedOffersProps) => {
  const { 
    completedForYou, 
    forYouLoading, 
    localClaimed, 
    setOfferAsClaimed 
  } = useCompletedOffers(userId)

  return (
    <CompletedOffersList
      offers={completedForYou}
      isLoading={forYouLoading}
      isForYou={true}
      localClaimed={localClaimed}
      onClaimed={setOfferAsClaimed}
    />
  )
}

export default CompletedOffers
