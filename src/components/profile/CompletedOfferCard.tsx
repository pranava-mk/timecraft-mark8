
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Gift } from "lucide-react"
import { useClaimCredits } from "@/hooks/useClaimCredits"
import { useState } from "react"

interface CompletedOffer {
  id: string
  title: string
  description: string
  service_type: string
  time_credits: number
  hours: number
  created_at: string
  provider_username?: string
  claimed?: boolean
}

interface CompletedOfferCardProps {
  offer: CompletedOffer
  isForYou: boolean
  onClaimed?: () => void
}

export const CompletedOfferCard = ({ offer, isForYou, onClaimed }: CompletedOfferCardProps) => {
  const { claimCredits, isClaiming } = useClaimCredits()
  const [isClaimed, setIsClaimed] = useState(offer.claimed || false)

  const handleClaim = async () => {
    try {
      // Update local state immediately for responsive UI
      setIsClaimed(true)
      
      // Notify parent component
      if (onClaimed) {
        onClaimed()
      }
      
      // Perform the actual claim operation
      await claimCredits({ 
        offerId: offer.id, 
        hours: offer.time_credits || offer.hours 
      })
    } catch (error) {
      // If there's an error, we don't revert the UI state to avoid confusion
      console.error("Error claiming credits:", error)
    }
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-wrap justify-between gap-2 mb-2 items-start">
          <h3 className="font-semibold text-navy">
            {offer.title || offer.service_type || "Service"}
          </h3>
          <div className="flex space-x-2">
            <Badge variant="outline" className="bg-teal/10 text-teal">
              {offer.time_credits || offer.hours} credits
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
            </Badge>
          </div>
        </div>
        
        <p className="text-sm text-navy/80 mb-3">
          {offer.description || `A ${offer.service_type} service exchange`}
        </p>
        
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="text-sm text-navy/70">
            {isForYou ? (
              <span>Provided by: {offer.provider_username}</span>
            ) : (
              <span>Requested by: {offer.provider_username}</span>
            )}
          </div>
          
          {!isForYou && (
            <Button 
              onClick={handleClaim}
              disabled={isClaiming || isClaimed}
              className={`${
                isClaimed 
                  ? 'bg-gray-400 hover:bg-gray-400 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              size="sm"
            >
              <Gift className="h-4 w-4 mr-1" />
              {isClaimed ? 'Credits Claimed' : 'Claim Credits'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
