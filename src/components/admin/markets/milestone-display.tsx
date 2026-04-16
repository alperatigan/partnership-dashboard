'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MILESTONES } from './types';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface MilestoneDisplayProps {
  monthlySales: number;
}

export function MilestoneDisplay({ monthlySales }: MilestoneDisplayProps) {
  const currentMilestone = MILESTONES.filter((m) => monthlySales >= m.sales).pop();
  const nextMilestone = MILESTONES.find((m) => monthlySales < m.sales);

  const progressToNext = nextMilestone
    ? Math.min(100, (monthlySales / nextMilestone.sales) * 100)
    : 100;

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Performance Milestones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {MILESTONES.map((milestone, index) => {
            const isAchieved = monthlySales >= milestone.sales;
            const isNext = !isAchieved && (index === 0 || monthlySales >= MILESTONES[index - 1].sales);

            return (
              <div key={milestone.tier} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isAchieved
                          ? 'bg-[#00A303] text-white'
                          : isNext
                          ? 'bg-[#FFC439] text-[#B8860B]'
                          : 'bg-[#E1E5EB] text-muted-foreground'
                      }`}
                    >
                      {isAchieved ? '✓' : milestone.tier}
                    </span>
                    <span className="font-medium">
                      Tier {milestone.tier}: {milestone.sales} clinics
                    </span>
                  </div>
                  <span
                    className={`font-semibold ${
                      isAchieved ? 'text-[#00A303]' : isNext ? 'text-[#FFC439]' : 'text-muted-foreground'
                    }`}
                  >
                    {isAchieved ? '+' : ''}{formatCurrency(milestone.bonus)}
                  </span>
                </div>
                {isNext && (
                  <Progress value={progressToNext} className="h-2" />
                )}
              </div>
            );
          })}

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Note:</span> Milestone bonuses are added to partner earnings only.
              Company profit does not include milestone bonuses.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
