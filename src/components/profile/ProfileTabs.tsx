
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import OfferCard from "@/components/explore/OfferCard"
import CompletedOffers from "@/components/profile/completed-offers"

interface ProfileTabsProps {
  userId: string | null;
  profile: any;
  activeUserOffers: any[];
  userOffersLoading: boolean;
  timeBalance: number | null;
}

const ProfileTabs = ({
  userId,
  profile,
  activeUserOffers,
  userOffersLoading,
  timeBalance
}: ProfileTabsProps) => {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <Tabs defaultValue="requests">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="requests">My Requests</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <Button 
              size="sm" 
              onClick={() => navigate('/offer')}
              disabled={userOffersLoading || (timeBalance || 0) <= 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          </div>
          
          <TabsContent value="requests">
            <div className="space-y-4">
              {userOffersLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-36 w-full" />
                  <Skeleton className="h-36 w-full" />
                </div>
              ) : activeUserOffers.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  You haven't created any active requests yet
                </p>
              ) : (
                activeUserOffers.map((offer) => (
                  <OfferCard 
                    key={offer.id} 
                    offer={{
                      ...offer,
                      timeCredits: offer.time_credits,
                      user: {
                        id: offer.profile_id,
                        name: profile?.username || 'Unknown',
                        avatar: profile?.avatar_url || '/placeholder.svg'
                      }
                    }}
                    showApplications={true}
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="completed">
            <CompletedOffers 
              userId={userId} 
              username={profile?.username} 
              avatar={profile?.avatar_url} 
            />
          </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>
  )
}

export default ProfileTabs
