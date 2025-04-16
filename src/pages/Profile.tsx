
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import ProfileTabs from "@/components/profile/ProfileTabs"
import { useProfileData } from "@/hooks/useProfileData"

const Profile = () => {
  const {
    userId,
    profile,
    profileLoading,
    timeBalance,
    timeBalanceLoading,
    activeUserOffers,
    userOffersLoading
  } = useProfileData()

  if (!userId) {
    return (
      <div className="container mx-auto p-4 space-y-6 max-w-2xl">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-4xl font-bold">Profile</h1>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-center">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
            <div className="space-y-2 mt-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-2xl">
      <ProfileHeader 
        profile={profile} 
        profileLoading={profileLoading} 
        timeBalance={timeBalance} 
        timeBalanceLoading={timeBalanceLoading} 
      />
      
      <ProfileTabs
        userId={userId}
        profile={profile}
        activeUserOffers={activeUserOffers}
        userOffersLoading={userOffersLoading}
        timeBalance={timeBalance}
      />
    </div>
  )
}

export default Profile
