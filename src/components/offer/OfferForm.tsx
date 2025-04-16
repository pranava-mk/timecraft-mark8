
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { DateSelector } from "./DateSelector"
import { TimeCreditsSelector } from "./TimeCreditsSelector"
import { serviceCategories } from "@/constants/serviceCategories"
import { useCreateOffer } from "@/hooks/useCreateOffer"
import { useToast } from "@/components/ui/use-toast"

interface OfferFormProps {
  timeBalance: number | null
  userId: string | null
}

export const OfferForm = ({ timeBalance, userId }: OfferFormProps) => {
  const navigate = useNavigate()
  const { createOffer, isCreating } = useCreateOffer()
  const [description, setDescription] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [otherServiceType, setOtherServiceType] = useState("")
  const [date, setDate] = useState<Date>()
  const [duration, setDuration] = useState("")
  const [timeCredits, setTimeCredits] = useState([1])
  const { toast } = useToast()
  
  // Function to handle duration input - only allow integers
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const value = e.target.value.replace(/\D/g, '')
    setDuration(value)
  }

  const hasNoCredits = (timeBalance || 0) <= 0
  const maxCredits = Math.min(5, timeBalance || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const finalServiceType = serviceType === "Others" ? otherServiceType : serviceType
    
    if ((timeBalance || 0) < timeCredits[0]) {
      toast({
        title: "Insufficient Credits",
        description: `You only have ${timeBalance} credits, but this request requires ${timeCredits[0]}.`,
        variant: "destructive"
      })
      return
    }
    
    await createOffer({
      title: finalServiceType,
      description,
      hours: Number(duration),
      duration: Number(duration),
      timeCredits: timeCredits[0],
      serviceType: finalServiceType,
      date: date?.toISOString(),
    })

    navigate('/profile')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {hasNoCredits && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            You don't have enough credits to create a request.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Service Type</label>
        <Select 
          value={serviceType} 
          onValueChange={setServiceType}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a service type" />
          </SelectTrigger>
          <SelectContent>
            {serviceCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {serviceType === "Others" && (
          <Input
            value={otherServiceType}
            onChange={(e) => setOtherServiceType(e.target.value)}
            placeholder="Please specify the service type"
            className="mt-2"
            required
          />
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your service request in detail..."
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Date</label>
        <DateSelector date={date} onSelect={setDate} />
      </div>

      <div className="flex gap-4">
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium">Duration (hours)</label>
          <Input 
            type="text"
            pattern="[0-9]*"
            min="1"
            value={duration}
            onChange={handleDurationChange}
            placeholder="e.g., 3"
            required
          />
        </div>
        
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium">Time Credits</label>
          <TimeCreditsSelector 
            value={timeCredits} 
            onChange={setTimeCredits}
            maxCredits={maxCredits}
            timeBalance={timeBalance}
            hasNoCredits={hasNoCredits}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => navigate('/profile')}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isCreating || timeCredits[0] > (timeBalance || 0) || hasNoCredits}
          className="bg-teal hover:bg-teal/90 text-cream"
        >
          {isCreating ? "Creating..." : "Create Request"}
        </Button>
      </div>
    </form>
  )
}
