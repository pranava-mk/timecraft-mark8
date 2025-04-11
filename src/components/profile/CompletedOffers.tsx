
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { CheckCircle2, BadgeCheck, User, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useTimeBalance } from "@/hooks/useTimeBalance"

interface CompletedOffersProps {
  userId: string | null
  username?: string
  avatar?: string
}

interface CompletedOffer {
  id: string
  title: string
  description: string
  service_type: string
  time_credits: number
  created_at: string
  completed_at: string
  provider_username?: string
  requester_username?: string
  claimed?: boolean
  hours?: number
  transaction_id?: string
}

const CompletedOffers = ({ userId, username, avatar }: CompletedOffersProps) => {
  const [activeTab, setActiveTab] = useState<'for-you' | 'by-you'>('for-you')
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { balance } = useTimeBalance(userId)
  
  // Add mutation for claiming credits
  const claimCreditsMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      console.log("Claiming credits for transaction:", transactionId)
      const { data, error } = await supabase
        .from('transactions')
        .update({ claimed: true })
        .eq('id', transactionId)
        .select()
        .single()
      
      if (error) {
        console.error("Error claiming credits:", error)
        throw error
      }
      console.log("Successfully claimed credits, transaction updated:", data)
      return data
    },
    onSuccess: () => {
      toast({
        title: "Credits claimed successfully",
        description: "The time credits have been added to your balance",
        variant: "default",
      })
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['completed-offers'] })
      queryClient.invalidateQueries({ queryKey: ['completed-offers', userId, 'by-you'] })
      queryClient.invalidateQueries({ queryKey: ['completed-offers', userId, 'for-you'] })
      queryClient.invalidateQueries({ queryKey: ['time-balance'] })
      queryClient.invalidateQueries({ queryKey: ['time-balance', userId] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
    },
    onError: (error) => {
      console.error("Error claiming credits:", error)
      toast({
        title: "Failed to claim credits",
        description: error.message,
        variant: "destructive",
      })
    }
  })
  
  // Fetch offers completed BY the user (user was the service provider)
  const { data: completedByYou, isLoading: byYouLoading } = useQuery({
    queryKey: ['completed-offers', userId, 'by-you'],
    queryFn: async () => {
      if (!userId) return []
      
      console.log("Fetching services completed BY you (provider):", userId)
      
      // Get transactions where the user was the provider
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          service,
          hours,
          created_at,
          offer_id,
          user_id,
          claimed
        `)
        .eq('provider_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching completed offers by you:', error)
        throw error
      }

      console.log("Found transactions completed by you:", data?.length || 0)

      // For each transaction, get the offer details
      const completedOffers = []
      
      for (const transaction of data || []) {
        // Get offer details
        const { data: offerData, error: offerError } = await supabase
          .from('offers')
          .select('title, description, service_type, time_credits')
          .eq('id', transaction.offer_id)
          .maybeSingle()
          
        if (offerError) {
          console.warn(`Error fetching offer ${transaction.offer_id}:`, offerError)
          continue
        }
        
        // Get requester username
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', transaction.user_id)
          .maybeSingle()
          
        if (userError) {
          console.warn(`Error fetching user ${transaction.user_id}:`, userError)
        }

        completedOffers.push({
          id: transaction.offer_id,
          transaction_id: transaction.id,
          title: offerData?.title || 'Unknown Title',
          description: offerData?.description || 'No description available',
          service_type: offerData?.service_type || transaction.service,
          time_credits: offerData?.time_credits || transaction.hours || 0,
          hours: transaction.hours,
          created_at: transaction.created_at,
          completed_at: transaction.created_at, // Using created_at as completed_at
          requester_username: userData?.username || 'Unknown User',
          claimed: transaction.claimed
        })
      }

      console.log("Processed completed offers by you:", completedOffers.length)
      return completedOffers
    },
    enabled: !!userId && activeTab === 'by-you'
  })
  
  // Fetch offers completed FOR the user (user made the request)
  const { data: completedForYou, isLoading: forYouLoading } = useQuery({
    queryKey: ['completed-offers', userId, 'for-you'],
    queryFn: async () => {
      if (!userId) return []
      
      console.log("Fetching services completed FOR you (requester):", userId)
      
      // Get transactions where user requested the service
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          service,
          hours,
          created_at,
          provider_id,
          offer_id
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching completed offers for you:', error)
        throw error
      }

      console.log("Found transactions completed for you:", data?.length || 0)

      // For each transaction, get the offer details
      const completedOffers = []
      
      for (const transaction of data || []) {
        // Get offer details
        const { data: offerData, error: offerError } = await supabase
          .from('offers')
          .select('title, description, service_type, time_credits')
          .eq('id', transaction.offer_id)
          .maybeSingle()
          
        if (offerError) {
          console.warn(`Error fetching offer ${transaction.offer_id}:`, offerError)
          continue
        }
        
        // Get provider username
        const { data: providerData, error: providerError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', transaction.provider_id)
          .maybeSingle()
          
        if (providerError) {
          console.warn(`Error fetching provider ${transaction.provider_id}:`, providerError)
        }

        completedOffers.push({
          id: transaction.offer_id,
          transaction_id: transaction.id,
          title: offerData?.title || 'Unknown Title',
          description: offerData?.description || 'No description available',
          service_type: offerData?.service_type || transaction.service,
          time_credits: offerData?.time_credits || transaction.hours || 0,
          hours: transaction.hours,
          created_at: transaction.created_at,
          completed_at: transaction.created_at,
          provider_username: providerData?.username || 'Unknown Provider'
        })
      }

      console.log("Processed completed offers for you:", completedOffers.length)
      return completedOffers
    },
    enabled: !!userId && activeTab === 'for-you'
  })

  const handleClaimCredits = async (transactionId: string) => {
    try {
      console.log("Attempting to claim credits for transaction:", transactionId)
      await claimCreditsMutation.mutate(transactionId)
    } catch (error) {
      console.error('Error claiming credits:', error)
    }
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'by-you' | 'for-you')}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="for-you" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            FOR YOU
          </TabsTrigger>
          <TabsTrigger value="by-you" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            BY YOU
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="for-you">
          <div className="space-y-4">
            {forYouLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            ) : completedForYou?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No services have been completed for you yet
              </p>
            ) : (
              completedForYou?.map((offer) => (
                <CompletedOfferCard
                  key={`for-you-${offer.transaction_id}`}
                  offer={offer}
                  isForYou={true}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="by-you">
          <div className="space-y-4">
            {byYouLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            ) : completedByYou?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                You haven't completed any services yet
              </p>
            ) : (
              completedByYou?.map((offer) => (
                <CompletedOfferCard
                  key={`by-you-${offer.transaction_id}`}
                  offer={offer}
                  isForYou={false}
                  onClaimCredits={handleClaimCredits}
                  isClaimingCredits={claimCreditsMutation.isPending}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Component for displaying a completed offer card
const CompletedOfferCard = ({ 
  offer, 
  isForYou,
  onClaimCredits,
  isClaimingCredits
}: { 
  offer: CompletedOffer, 
  isForYou: boolean,
  onClaimCredits?: (transactionId: string) => void,
  isClaimingCredits?: boolean
}) => {
  // Only show claim button if:
  // 1. It's in the "By You" section (not For You)
  // 2. The offer hasn't been claimed yet
  // 3. There is a claim handler function
  // 4. There is a transaction ID to claim
  const showClaimButton = !isForYou && !offer.claimed && onClaimCredits && offer.transaction_id;

  return (
    <Card className="gradient-border">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg text-navy">{offer.title}</h3>
            <p className="text-sm text-navy/80">{offer.description}</p>
          </div>
          <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {offer.claimed ? "Claimed" : "Completed"}
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="bg-mint/10 text-navy px-3 py-1 rounded-full text-xs">
            {offer.service_type}
          </div>
          <div className="bg-teal/10 text-teal px-3 py-1 rounded-full text-xs">
            {offer.time_credits} credits
          </div>
          <div className="bg-navy/10 text-navy px-3 py-1 rounded-full text-xs">
            {new Date(offer.created_at).toLocaleDateString()}
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-navy/10 text-sm flex justify-between items-center">
          <div>
            {isForYou ? (
              <p>Completed by: <span className="font-medium">{offer.provider_username}</span></p>
            ) : (
              <p>Requested by: <span className="font-medium">{offer.requester_username}</span></p>
            )}
          </div>
          
          {showClaimButton && (
            <Button 
              onClick={() => onClaimCredits?.(offer.transaction_id!)} 
              disabled={isClaimingCredits}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <BadgeCheck className="h-4 w-4 mr-2" />
              Claim {offer.hours} Credits
            </Button>
          )}
          
          {!isForYou && offer.claimed && (
            <div className="flex items-center text-green-700 font-medium text-sm">
              <BadgeCheck className="h-4 w-4 mr-1" />
              Credits Claimed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default CompletedOffers
