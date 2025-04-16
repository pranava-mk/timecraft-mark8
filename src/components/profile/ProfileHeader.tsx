
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"

interface ProfileHeaderProps {
  profile: any;
  profileLoading: boolean;
  timeBalance: number | null;
  timeBalanceLoading: boolean;
}

export const ProfileHeader = ({ 
  profile, 
  profileLoading, 
  timeBalance,
  timeBalanceLoading 
}: ProfileHeaderProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      queryClient.clear()
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error logging out",
        description: error.message,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-4xl font-bold">Profile</h1>
        <div className="flex items-center gap-4">
          {timeBalanceLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <div className="text-sm font-medium">
              <span className="text-teal">{timeBalance}</span> credits available
            </div>
          )}
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            {profileLoading ? (
              <Skeleton className="h-16 w-16 md:h-20 md:w-20 rounded-full" />
            ) : (
              <Avatar className="h-16 w-16 md:h-20 md:w-20">
                <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>
                  {profile?.username?.substring(0, 2).toUpperCase() || 'UN'}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              {profileLoading ? (
                <Skeleton className="h-8 w-40" />
              ) : (
                <CardTitle className="text-xl md:text-2xl">
                  {profile?.username || 'Username not set'}
                </CardTitle>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UserInterests profile={profile} profileLoading={profileLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

// UserInterests is used directly within ProfileHeader for simplicity
const UserInterests = ({ profile, profileLoading }: { profile: any; profileLoading: boolean }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Interests</h3>
        {profileLoading ? (
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile?.services?.map((service: string) => (
              <span
                key={service}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground"
              >
                {service}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
