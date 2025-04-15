
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateOffer } from "@/hooks/useCreateOffer"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon, CreditCard, AlertCircle } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const serviceCategories = [
  "Programming",
  "Teaching",
  "Gardening",
  "Design",
  "Writing",
  "Marketing",
  "Translation",
  "Consulting",
  "Photography",
  "Music",
  "Cooking",
  "Fitness"
]

const Offer = () => {
  const navigate = useNavigate()
  const { createOffer, isCreating } = useCreateOffer()
  const [description, setDescription] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [otherServiceType, setOtherServiceType] = useState("")
  const [date, setDate] = useState<Date>()
  const [duration, setDuration] = useState("")
  const [timeCredits, setTimeCredits] = useState([1])
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  
  // Get user ID
  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user?.id) {
        setUserId(data.user.id)
      }
    }
    
    fetchUserId()
  }, [])

  // Get time balance directly from the database - single source of truth
  const { data: timeBalance, isLoading: timeBalanceLoading } = useQuery({
    queryKey: ['time-balance'],
    queryFn: async () => {
      if (!userId) return null
      
      const { data, error } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching time balance:', error)
        return 0
      }
      
      return data?.balance || 0
    },
    enabled: !!userId
  })

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

  // Function to handle duration input - only allow integers
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const value = e.target.value.replace(/\D/g, '')
    setDuration(value)
  }

  const hasNoCredits = (timeBalance || 0) <= 0

  const maxCredits = Math.min(5, timeBalance || 0)
  
  // Get today's date for calendar disable past dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl md:text-4xl font-bold mb-6">Create New Request</h1>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Request Details</CardTitle>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-teal" />
              <span className="text-sm font-medium">
                {timeBalanceLoading ? "Loading..." : `Available: ${timeBalance} credits`}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasNoCredits && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                You don't have enough credits to create a request.
              </AlertDescription>
            </Alert>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit}>
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < today}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start font-normal"
                      disabled={hasNoCredits}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {timeCredits[0]} Credit{timeCredits[0] !== 1 ? 's' : ''}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Select Time Credits</h4>
                      <Slider
                        value={timeCredits}
                        onValueChange={setTimeCredits}
                        min={1}
                        max={maxCredits > 0 ? maxCredits : 1}
                        step={1}
                        className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                        disabled={hasNoCredits}
                      />
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">1 Credit</span>
                        <span className="text-xs text-muted-foreground">{maxCredits > 0 ? maxCredits : 1} Credits</span>
                      </div>
                      <div className="mt-2 text-center text-sm text-muted-foreground">
                        {timeCredits[0] > (timeBalance || 0) ? (
                          <span className="text-destructive">Insufficient credits!</span>
                        ) : (
                          <span>You have {timeBalance || 0} credits available</span>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
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
        </CardContent>
      </Card>
    </div>
  )
}

export default Offer
