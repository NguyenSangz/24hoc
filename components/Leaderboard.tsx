import React, { useEffect, useState } from 'react';
import { Trophy, Medal, User, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  displayName: string;
  totalScore: number;
  highScore: number;
  lastActive: number;
}

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        setEntries(data);
      } catch (e) {
        console.error("Failed to fetch leaderboard", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted font-medium animate-pulse">Đang tải bảng xếp hạng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="text-yellow-500" />
          Bảng Vàng Vinh Danh
        </h3>
        <div className="text-xs font-black text-muted uppercase tracking-widest flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
          <TrendingUp size={14} className="text-primary" />
          Thời gian thực
        </div>
      </div>

      <div className="grid gap-3">
        {entries.length > 0 ? entries.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              i === 0 ? 'bg-yellow-500/5 border-yellow-500/20' : 
              i === 1 ? 'bg-zinc-500/5 border-zinc-500/20' :
              i === 2 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-surface border-border'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
              i === 0 ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20' : 
              i === 1 ? 'bg-zinc-400 text-white' :
              i === 2 ? 'bg-orange-400 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-muted'
            }`}>
              {i < 3 ? <Medal size={20} /> : i + 1}
            </div>
            
            <div className="flex-1">
              <div className="font-bold text-text">{entry.displayName}</div>
              <div className="text-[10px] text-muted font-bold uppercase tracking-widest">
                Điểm cao nhất: {entry.highScore}
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-black text-primary">{entry.totalScore}</div>
              <div className="text-[10px] text-muted font-bold uppercase tracking-widest">Tổng điểm</div>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-12 text-muted italic bg-surface rounded-3xl border border-dashed border-border">
            Chưa có dữ liệu thăng hạng. Hãy là người đầu tiên!
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
