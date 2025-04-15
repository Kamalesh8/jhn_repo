import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "@radix-ui/react-progress";
import { Star, Target, TrendingUp } from "lucide-react";

interface Achievement {
  title: string;
  description: string;
  progress: number;
  total: number;
  icon: JSX.Element;
}

interface PointsCardProps {
  points: number;
  level: number;
  nextLevelPoints: number;
  achievements: Achievement[];
}

export function PointsCard({
  points,
  level,
  nextLevelPoints,
  achievements,
}: PointsCardProps) {
  const progressToNextLevel = (points / nextLevelPoints) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-6 w-6 text-primary" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              <span className="text-3xl font-bold text-primary">{level}</span>
            </div>
            <h3 className="mt-2 font-semibold">Level {level}</h3>
            <p className="text-sm text-muted-foreground">
              {points.toLocaleString()} / {nextLevelPoints.toLocaleString()} points
            </p>
          </div>

          <div className="space-y-2">
            <Progress value={progressToNextLevel} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(progressToNextLevel)}% to Level {level + 1}
            </p>
          </div>

          <div className="space-y-4 mt-6">
            <h4 className="font-semibold">Recent Achievements</h4>
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{achievement.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>
                  <Progress
                    value={(achievement.progress / achievement.total) * 100}
                    className="h-1 mt-2"
                  />
                  <p className="text-xs text-right text-muted-foreground mt-1">
                    {achievement.progress} / {achievement.total}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
