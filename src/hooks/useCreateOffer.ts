
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useQuery } from '@tanstack/react-query'

interface OfferInput {
  title: string
  description: string
  hours: number
  serviceType: string
  date?: string
  duration: number
  timeCredits: number 
}

export const useCreateOffer = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Get time balance directly from the database
  const { data: timeBalance } = useQuery({
    queryKey: ['time-balance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      
      const { data, error } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching time balance:', error)
        return 0
      }
      
      return data?.balance || 0
    }
  })

  const createOffer = useMutation({
    mutationFn: async (offer: OfferInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      console.log(`Checking credit balance: Available ${timeBalance}, needs ${offer.timeCredits}`)
      
      if ((timeBalance || 0) < offer.timeCredits) {
        throw new Error(`Insufficient credits. You need ${offer.timeCredits} but only have ${timeBalance} available.`)
      }

      console.log('Creating offer with data:', {
        title: offer.title,
        description: offer.description,
        hours: offer.duration,
        time_credits: offer.timeCredits,
        service_type: offer.serviceType,
        duration: offer.duration
      })

      const { error, data } = await supabase
        .from('offers')
        .insert([{ 
          title: offer.title,
          description: offer.description,
          hours: offer.duration,
          time_credits: offer.timeCredits,
          service_type: offer.serviceType,
          date: offer.date,
          duration: offer.duration,
          status: 'available',
          profile_id: user.id,
          created_at: new Date().toISOString()
        }])
        .select()
      
      if (error) throw error
      
      return data
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Request created successfully",
      })
      queryClient.invalidateQueries({ queryKey: ['user-offers'] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['time-balance'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create request: " + error.message,
        variant: "destructive",
      })
    }
  })

  return {
    createOffer: createOffer.mutate,
    isCreating: createOffer.isPending
  }
}
