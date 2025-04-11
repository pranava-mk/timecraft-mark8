
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useEffect } from 'react'

export const useApplicationManagement = (offerId?: string) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    const channel = supabase
      .channel('application-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offer_applications'
        },
        () => {
          console.log('Applications changed via websocket')
          queryClient.invalidateQueries({ queryKey: ['offer-applications'] })
          queryClient.invalidateQueries({ queryKey: ['user-application'] })
          queryClient.invalidateQueries({ queryKey: ['user-applications'] })
          queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['offer-applications', offerId],
    queryFn: async () => {
      if (!offerId) return []
      
      const { data, error } = await supabase
        .from('offer_applications')
        .select(`
          *,
          profiles:applicant_id (
            username,
            avatar_url
          )
        `)
        .eq('offer_id', offerId)
      
      if (error) throw error
      return data
    },
    enabled: !!offerId
  })

  const { data: userApplication } = useQuery({
    queryKey: ['user-application', offerId],
    queryFn: async () => {
      if (!offerId) return null
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('offer_applications')
        .select('*')
        .eq('offer_id', offerId)
        .eq('applicant_id', user.id)
        .maybeSingle()
      
      if (error) throw error
      return data
    },
    enabled: !!offerId
  })

  const { data: userApplications } = useQuery({
    queryKey: ['user-applications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('offer_applications')
        .select('*')
        .eq('applicant_id', user.id)
      
      if (error) throw error
      return data
    }
  })

  const applyToOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('offer_applications')
        .insert({
          offer_id: offerId,
          applicant_id: user.id,
          status: 'pending'
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Application submitted successfully",
      })
      queryClient.invalidateQueries({ queryKey: ['offer-applications'] })
      queryClient.invalidateQueries({ queryKey: ['user-application'] })
      queryClient.invalidateQueries({ queryKey: ['user-applications'] })
      queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to submit application: " + error.message,
        variant: "destructive",
      })
    }
  })

  const updateApplicationStatus = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string, status: 'accepted' | 'rejected' }) => {
      const { error: applicationError } = await supabase
        .from('offer_applications')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
      
      if (applicationError) {
        console.error('Application update error:', applicationError)
        return
      }

      if (status === 'accepted') {
        const { data: application, error: fetchError } = await supabase
          .from('offer_applications')
          .select('offer_id')
          .eq('id', applicationId)
          .single()

        if (fetchError) {
          console.error('Fetch application error:', fetchError)
          return
        }
        
        if (application && application.offer_id) {
          const { error: offerError } = await supabase
            .from('offers')
            .update({ 
              status: 'booked', 
              updated_at: new Date().toISOString()
            })
            .eq('id', application.offer_id)

          if (offerError) {
            console.error("Error updating offer status:", offerError);
            return
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-applications'] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['user-applications'] })
    },
    onError: (error: Error) => {
      console.error('Application status update error:', error)
    }
  })

  return {
    applications,
    userApplication,
    userApplications,
    isLoadingApplications,
    applyToOffer: applyToOffer.mutate,
    updateApplicationStatus: updateApplicationStatus.mutate,
    isApplying: applyToOffer.isPending,
    isUpdating: updateApplicationStatus.isPending
  }
}
