
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react"

export const useTimeBalance = (userId: string | null) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId)

  // If userId is not provided, get the current user
  useEffect(() => {
    if (!userId) {
      const fetchCurrentUser = async () => {
        const { data } = await supabase.auth.getUser()
        if (data?.user?.id) {
          setCurrentUserId(data.user.id)
        }
      }
      fetchCurrentUser()
    }
  }, [userId])

  const { data: timeBalance, isLoading, error } = useQuery({
    queryKey: ['time-balance', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null
      
      console.log("Fetching time balance for user:", currentUserId)
      
      const { data, error } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', currentUserId)
        .maybeSingle()
        
      if (error) {
        console.error('Error fetching time balance:', error)
        throw error
      }
      
      return data?.balance || 0
    },
    enabled: !!currentUserId
  })

  return { 
    timeBalance, 
    isLoading,
    error
  }
}
