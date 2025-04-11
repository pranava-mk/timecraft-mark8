
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export const useTimeBalance = (userId?: string | null) => {
  const { data: timeBalance, isLoading, error } = useQuery({
    queryKey: ['time-balance', userId],
    queryFn: async () => {
      if (!userId) return null

      console.log("Fetching time balance for user:", userId)
      
      const { data, error } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.error("Error fetching time balance:", error)
        throw error
      }
      
      console.log("Time balance fetched:", data?.balance)
      return data?.balance || 0
    },
    enabled: !!userId
  })

  return {
    balance: timeBalance,
    isLoading,
    error
  }
}
