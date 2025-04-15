import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  avatar?: string;
  referralCount: number;
}

interface LeaderboardCardProps {
  leaders: LeaderboardEntry[];
  loading?: boolean;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />;
    default:
      return <span className="text-base sm:text-lg font-bold">{rank}</span>;
  }
};

const getBackgroundColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-900/10";
    case 2:
      return "bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/20 dark:to-gray-800/10";
    case 3:
      return "bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-900/10";
    default:
      return "bg-white dark:bg-gray-800/30";
  }
};

const LeaderboardSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="text-right space-y-1">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    ))}
  </div>
);

export function LeaderboardCard({ leaders, loading = false }: LeaderboardCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <span className="text-lg sm:text-xl">Top Referrers</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Our most successful community members
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LeaderboardSkeleton />
        ) : (
          <div className="space-y-3">
            {leaders.map((leader) => (
              <div
                key={leader.rank}
                className={`flex items-center justify-between rounded-lg p-3 ${getBackgroundColor(
                  leader.rank
                )} transition-all hover:scale-[1.02] hover:shadow-sm`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center">
                    {getRankIcon(leader.rank)}
                  </div>
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarImage src={leader.avatar} alt={leader.name} />
                    <AvatarFallback>
                      {leader.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium sm:font-semibold line-clamp-1">
                      {leader.name}
                    </p>
                    <Badge 
                      variant="secondary" 
                      className="mt-1 text-xs sm:text-sm"
                    >
                      {leader.referralCount} referrals
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base sm:text-lg font-bold text-primary">
                    {leader.points.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    points
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
