'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'partner_joined' | 'demo_approved' | 'payment_made' | 'alert_triggered' | 'lead_created';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
  maxItems?: number;
}

const activityIcons: Record<Activity['type'], { icon: string; color: string }> = {
  partner_joined: { icon: '👤', color: 'bg-green-100 text-green-600' },
  demo_approved: { icon: '✓', color: 'bg-blue-100 text-blue-600' },
  payment_made: { icon: '💰', color: 'bg-emerald-100 text-emerald-600' },
  alert_triggered: { icon: '⚠️', color: 'bg-yellow-100 text-yellow-600' },
  lead_created: { icon: '📋', color: 'bg-purple-100 text-purple-600' },
};

export function ActivityFeed({ 
  activities, 
  title = 'Recent Activity',
  maxItems = 10 
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {displayedActivities.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No recent activity
            </div>
          ) : (
            displayedActivities.map((activity) => {
              const iconConfig = activityIcons[activity.type];
              return (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', iconConfig.color)}>
                    <span className="text-base">{iconConfig.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
