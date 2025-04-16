
import { Button } from "@/components/ui/button"
import { CheckCircle2, Trash2 } from "lucide-react"
import { useState } from "react"

interface OfferOwnerActionsProps {
  offerId: string
  status: string
  hasAcceptedApplication: boolean
  onDelete: () => void
  onComplete: () => void
  isDeleting: boolean
  isCompleting: boolean
}

const OfferOwnerActions = ({
  offerId,
  status,
  hasAcceptedApplication,
  onDelete,
  onComplete,
  isDeleting,
  isCompleting
}: OfferOwnerActionsProps) => {
  // Add local state to track if the button was clicked
  const [wasCompletedClicked, setWasCompletedClicked] = useState(false)
  
  // If the offer is already completed, don't show any action buttons
  if (status === 'completed') {
    return null
  }
  
  // Handle the complete button click with immediate visual feedback
  const handleCompleteClick = () => {
    // Immediately set local state for instant UI feedback
    setWasCompletedClicked(true)
    // Call the actual complete function
    onComplete()
  }
  
  // If an offer has an accepted application, show the Mark as Done button
  if (hasAcceptedApplication) {
    // Show a "completed" state if the button was clicked or completion is in progress
    if (wasCompletedClicked || isCompleting) {
      return (
        <Button
          variant="outline"
          disabled={true}
          className="w-full md:w-auto flex items-center justify-center bg-green-100 text-green-800 border-green-200"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Completed
        </Button>
      )
    }
    
    return (
      <Button
        onClick={handleCompleteClick}
        variant="default"
        disabled={isCompleting}
        className="w-full md:w-auto flex items-center justify-center bg-green-600 hover:bg-green-700 text-white"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Mark as Done
      </Button>
    )
  }

  // If no accepted application, show the Delete button
  return (
    <Button
      onClick={onDelete}
      variant="destructive"
      disabled={isDeleting}
      className="w-full md:w-auto flex items-center justify-center"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </Button>
  )
}

export default OfferOwnerActions
