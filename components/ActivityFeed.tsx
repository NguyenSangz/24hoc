import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, Trophy, History as HistoryIcon, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Activity {
  username: string;
  displayName: string;
  type: string;
  value: number;
  timestamp: number;
}

const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities');
      const data = await res.json();
      setActivities(data);
    } catch (e) {
      console.error("Failed to fetch activities", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  if (isLoading && activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-muted font-bold uppercase tracking-widest">Đang tải hoạt động...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <HistoryIcon size={18} className="text-primary" />
          <h3 className="text-sm font-black text-muted uppercase tracking-[0.2em]">Hoạt động mới nhất</h3>
        </div>
      </div>

      <div className="relative">
        {/* Connection line */}
        <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-zinc-100 dark:bg-zinc-800" />

        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {activities.length > 0 ? (
              activities.slice(0, 8).map((activity, i) => (
                <motion.div
                  key={activity.timestamp + activity.username}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-4 relative z-10"
                >
                  <div className="w-11 h-11 rounded-xl bg-surface border border-border flex items-center justify-center shadow-sm shrink-0">
                    {activity.type === 'SCORE_UP' ? (
                      <Zap size={20} className="text-yellow-500 fill-yellow-500/20" />
                    ) : (
                      <Target size={20} className="text-primary" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text font-medium leading-normal">
                      <span className="font-bold text-primary">{activity.displayName}</span>
                      {activity.type === 'SCORE_UP' && (
                        <> đã thăng tiến <span className="font-black text-yellow-600">+{activity.value}</span> điểm tri thức!</>
                      )}
                    </p>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-1">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted italic text-xs">
                Chưa có hoạt động nào được ghi nhận.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;
