
import { Skeleton } from "@/components/ui/skeleton"
import { CompletedOfferCard } from "../CompletedOfferCard"
import { CompletedOffer } from "./useCompletedOffers"

interface CompletedOffersListProps {
  offers: CompletedOffer[] | undefined
  isLoading: boolean
  isForYou: boolean
  localClaimed: Record<string, boolean>
  onClaimed: (offerId: string) => void
}

const CompletedOffersList = ({ 
  offers, 
  isLoading, 
  isForYou,
  localClaimed,
  onClaimed
}: CompletedOffersListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    )
  }

  if (!offers?.length) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No completed services found
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <CompletedOfferCard
          key={offer.id}
          offer={{
            ...offer,
            claimed: localClaimed[offer.id] || offer.claimed
          }}
          isForYou={isForYou}
          onClaimed={() => onClaimed(offer.id)}
        />
      ))}
    </div>
  )
}

export default CompletedOffersList
