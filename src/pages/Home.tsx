
import React, { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import HomeHeader from "@/components/home/HomeHeader"
import QuickStats from "@/components/home/QuickStats"
import PendingOffers from "@/components/home/PendingOffers"
import StatsCards from "@/components/home/StatsCards"
import { supabase } from "@/integrations/supabase/client"

const Home = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const transactionsChannel = supabase
      .channel('home-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Transaction change detected on home page', payload)
          queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
          queryClient.invalidateQueries({ queryKey: ['completed-offers'] })
          queryClient.invalidateQueries({ queryKey: ['user-stats'] })
          queryClient.invalidateQueries({ queryKey: ['time-balance'] })
        }
      )
      .subscribe()

    const offersChannel = supabase
      .channel('home-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers'
        },
        (payload) => {
          console.log('Offer change detected on home page', payload)
          queryClient.invalidateQueries({ queryKey: ['offers'] })
          queryClient.invalidateQueries({ queryKey: ['user-offers'] })
          queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
          queryClient.invalidateQueries({ queryKey: ['completed-offers'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(transactionsChannel)
      supabase.removeChannel(offersChannel)
    }
  }, [queryClient])

  return (
    <div className="container mx-auto p-6 bg-gradient-to-b from-cream to-white">
      <HomeHeader />
      <QuickStats />
      <div className="space-y-6">
        <PendingOffers />
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-navy flex items-center gap-2">
            Premium Stats 
            <span className="text-xs bg-gradient-to-r from-amber-500 to-amber-300 text-white px-2 py-1 rounded-full">
              Premium
            </span>
          </h2>
          <div className="relative">
            <div className="absolute inset-0 backdrop-blur-md bg-white/1 rounded-xl z-10"></div>
            <div className="relative z-0 pointer-events-none">
              <StatsCards />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
