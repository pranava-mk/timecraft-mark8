
import { Button } from "@/components/ui/button"
import { Check, Gift, Hourglass } from "lucide-react"
import { useClaimCredits } from "@/hooks/useClaimCredits"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"

interface OfferApplyButtonProps {
  offerId: string
  status: string
  isApplied?: boolean
  applicationStatus?: string
  userApplication?: any
  onApply: (offerId: string) => void
  isApplying: boolean
  timeCredits?: number
}

const OfferApplyButton = ({ 
  offerId, 
  status, 
  isApplied, 
  applicationStatus, 
  userApplication, 
  onApply, 
  isApplying,
  timeCredits = 1
}: OfferApplyButtonProps) => {
  // Use initialClaimed from the hook to set the initial state
  const { claimCredits, isClaiming, isClaimed: initialClaimed } = useClaimCredits()
  const [isClaimed, setIsClaimed] = useState(initialClaimed)
  
  // Update local claimed state if transaction is already claimed (from the database)
  useEffect(() => {
    if (initialClaimed) {
      setIsClaimed(true)
    }
  }, [initialClaimed])

  // Check if the userApplication includes claimed status
  useEffect(() => {
    if (userApplication?.claimed) {
      setIsClaimed(true)
    }
  }, [userApplication])

  const handleClaim = async () => {
    try {
      // Immediately update the UI state to prevent multiple clicks
      setIsClaimed(true)
      
      // Actually perform the claim operation
      await claimCredits({ 
        offerId, 
        hours: timeCredits 
      })
    } catch (error) {
      // Don't revert UI state even on error to avoid confusion
      console.error("Error claiming credits:", error)
    }
  }
  
  // Only show claim button for service providers (applicants) when the offer is completed
  if (isApplied && status === 'completed' && (applicationStatus === 'accepted' || userApplication?.status === 'accepted')) {
    if (isClaimed) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600 py-1 px-3 mt-4 md:mt-0">
          <Gift className="h-4 w-4 mr-1 inline" />
          Credits Claimed
        </Badge>
      )
    }
    
    return (
      <Button 
        onClick={handleClaim}
        disabled={isClaiming}
        className="w-full md:w-auto mt-4 md:mt-0 bg-green-500 hover:bg-green-600 text-white"
      >
        <Gift className="h-4 w-4 mr-1" />
        Claim Credits
      </Button>
    )
  }
  
  if (isApplied) {
    const appStatus = applicationStatus || 'pending'
    
    const statusColorClass = appStatus === 'pending' 
      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
      : appStatus === 'accepted'
        ? 'bg-green-100 text-green-800 border-green-300'
        : 'bg-red-100 text-red-800 border-red-300'
      
    return (
      <Button 
        disabled 
        variant="secondary"
        className={`w-full md:w-auto mt-4 md:mt-0 ${statusColorClass}`}
      >
        <Hourglass className="h-4 w-4 mr-1" />
        {appStatus === 'pending' ? 'Application Pending' : 
         appStatus === 'accepted' ? 'Application Accepted' : 
         'Application Rejected'}
      </Button>
    )
  }

  if (userApplication) {
    const statusColorClass = userApplication.status === 'pending' 
      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
      : userApplication.status === 'accepted'
        ? 'bg-green-100 text-green-800 border-green-300'
        : 'bg-red-100 text-red-800 border-red-300';

    return (
      <Button 
        disabled 
        variant="secondary"
        className={`w-full md:w-auto mt-4 md:mt-0 ${statusColorClass}`}
      >
        <Hourglass className="h-4 w-4 mr-1" />
        {userApplication.status === 'pending' ? 'Application Pending' : 
          userApplication.status === 'accepted' ? 'Application Accepted' : 
          'Application Rejected'}
      </Button>
    )
  }

  return (
    <Button 
      onClick={() => onApply(offerId)}
      disabled={status !== 'available' || isApplying}
      className="w-full md:w-auto mt-4 md:mt-0 bg-teal hover:bg-teal/90 text-cream"
    >
      <Check className="h-4 w-4 mr-1" />
      {status === 'available' ? 'Apply' : 'Not Available'}
    </Button>
  )
}

export default OfferApplyButton
