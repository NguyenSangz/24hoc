import React, { useEffect, useState } from 'react';
import { User, UserStats } from '../types';
import { statsStorage, exportData, importData } from '../utils/storage';
import { X, Trophy, Target, Brain, Medal, Star, User as UserIcon, Crown, Sparkles, Download, Upload, HardDrive, Loader2, CheckCircle2, History as HistoryIcon, Flame, Settings, Code, Bug, Wrench, Info, RefreshCw, BarChart2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'diagnostics' | 'settings'>('profile');
  const [simulateActive, setSimulateActive] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
        const s = await statsStorage.getStats(user.username);
        setStats(s);
    };
    loadStats();
  }, [user.username]);

  const handleExport = () => {
    exportData(user.username);
    toast.success("Đã xuất tệp sao lưu!");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setIsImporting(true);
        const success = await importData(user.username, e.target.files[0]);
        if (success) {
            toast.success("Khôi phục dữ liệu thành công! Đang tải lại...");
            setTimeout(() => window.location.reload(), 1500);
        } else {
            toast.error("File sao lưu không hợp lệ.");
        }
        setIsImporting(false);
    }
  };

  if (!stats) return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Loader2 className="animate-spin text-white" size={32} />
      </div>
  );

  // Calculate Level and Rank
  const level = Math.floor(stats.totalScore / 1000) + 1;
  const progressToNextLevel = (stats.totalScore % 1000) / 1000 * 100;

  const getRankTitle = (lvl: number) => {
    if (lvl >= 50) return { title: 'Đại Tôn Sư', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    if (lvl >= 30) return { title: 'Bậc Thầy Tri Thức', color: 'text-red-500', bg: 'bg-red-500/10' };
    if (lvl >= 20) return { title: 'Nhà Thông Thái', color: 'text-purple-500', bg: 'bg-purple-500/10' };
    if (lvl >= 10) return { title: 'Học Giả Ưu Tú', color: 'text-blue-600', bg: 'bg-blue-500/10' };
    if (lvl >= 5) return { title: 'Nhà Thám Hiểm', color: 'text-emerald-600', bg: 'bg-emerald-500/10' };
    return { title: 'Học Viên Tập Sự', color: 'text-muted', bg: 'bg-gray-100' };
  };

  const rank = getRankTitle(level);

  const effectiveStreak = simulateActive ? Math.max(stats.streak, 9) : stats.streak;

  const streakMilestones = [
    { days: 1, label: '1 ngày', icon: '❄️' },
    { days: 2, label: '2 ngày', icon: '🌱' },
    { days: 3, label: '3 ngày', icon: '⚡' },
    { days: 5, label: '5 ngày', icon: '🌟' },
    { days: 7, label: '7 ngày', icon: '🏆' },
    { days: 10, label: '10 ngày', icon: '🔥' },
    { days: 15, label: '15 ngày', icon: '👑' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md md:max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-border flex flex-col animate-in zoom-in-95 duration-200 relative">
        
        {/* Decorative Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 to-secondary/20 -z-0"></div>
        
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-start relative z-10">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary flex items-center gap-2">
             <UserIcon className="text-primary" size={24} />
             Hồ sơ & Cài đặt
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full bg-surface/50 hover:bg-surface transition-colors text-muted hover:text-text border border-transparent hover:border-border shadow-sm"
          >
             <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex px-4 md:px-6 border-b border-border bg-surface/50 relative z-10">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`flex-1 py-3 text-center text-xs md:text-sm font-black uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <UserIcon size={14} />
            Hồ sơ học tập
          </button>
          <button
            onClick={() => setActiveSubTab('diagnostics')}
            className={`flex-1 py-3 text-center text-xs md:text-sm font-black uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'diagnostics'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <Brain size={14} />
            Chẩn đoán AI
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`flex-1 py-3 text-center text-xs md:text-sm font-black uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'settings'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <Settings size={14} />
            Cài đặt & Gỡ lỗi
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pt-6 relative z-10 overflow-y-auto max-h-[65vh] custom-scrollbar">
            {activeSubTab === 'profile' ? (
              <>
                {/* Avatar & Main Info */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary p-1 shadow-xl">
                        <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-4xl font-bold text-primary">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-surface border border-border p-1.5 rounded-full shadow-md">
                         {level >= 50 ? <Crown size={20} className="text-yellow-500 fill-yellow-500"/> : <Sparkles size={20} className="text-yellow-500 fill-yellow-500"/>}
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-text mt-4">{user.displayName}</h2>
                    <div className="text-sm text-muted font-mono">@{user.username}</div>
                    
                    <div className={`mt-3 px-4 py-1 rounded-full text-sm font-bold border ${rank.bg} ${rank.color} border-current/20`}>
                      {rank.title}
                    </div>
                </div>

                {/* Level Progress */}
                <div className="mb-8 bg-background p-4 rounded-2xl border border-border">
                   <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-text">Cấp độ {level}</span>
                      <span className="text-primary">{Math.floor(progressToNextLevel)}%</span>
                   </div>
                   <div className="w-full h-3 bg-surface rounded-full overflow-hidden border border-border shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out rounded-full relative" 
                        style={{ width: `${progressToNextLevel}%` }}
                      >
                        <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImRvMiIgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJ3aGl0ZSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJ1cmwoI2RvMikiLz48L3N2Zz4=')]"></div>
                      </div>
                   </div>
                   <p className="text-xs text-muted mt-2 text-center">
                     Cần thêm <span className="font-bold text-text">{1000 - (stats.totalScore % 1000)} XP</span> để lên cấp {level + 1}
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Visual Streak Counter Widget */}
                    <div className={`col-span-2 p-5 rounded-[2rem] border relative overflow-hidden transition-all duration-500 ${
                      effectiveStreak > 7 
                        ? 'bg-gradient-to-br from-red-950/85 via-orange-950/90 to-zinc-950 border-orange-500/50 shadow-2xl shadow-orange-500/10 ring-2 ring-orange-500/30' 
                        : 'bg-gradient-to-br from-orange-50/80 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border-border'
                    }`}>
                        
                        {/* Shimmer/Ember Background for >7 Days */}
                        {effectiveStreak > 7 && (
                          <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {/* Layer 1: Fire glow container */}
                            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-red-600/20 rounded-full blur-[40px] animate-pulse"></div>
                            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-amber-500/20 rounded-full blur-[40px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                            
                            {/* Ambient embers */}
                            {[...Array(6)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute bg-orange-500 rounded-full"
                                style={{
                                  bottom: -10,
                                  left: `${15 + i * 15}%`,
                                  width: i % 2 === 0 ? 4 : 6,
                                  height: i % 2 === 0 ? 4 : 6,
                                  opacity: 0.7,
                                }}
                                animate={{
                                  y: -120,
                                  x: [0, (i % 2 === 0 ? 15 : -15), 0],
                                  opacity: [0, 0.8, 0],
                                  scale: [1, 1.4, 0.5],
                                }}
                                transition={{
                                  duration: 3 + (i % 3),
                                  repeat: Infinity,
                                  delay: i * 0.4,
                                  ease: "easeInOut"
                                }}
                              />
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex flex-1 items-center gap-3 md:gap-3.5">
                               <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                                 effectiveStreak > 7
                                   ? 'bg-gradient-to-tr from-red-500 to-orange-400 text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-400 animate-bounce'
                                   : 'bg-orange-500 text-white'
                               }`}>
                                  {effectiveStreak > 7 ? (
                                    <Flame size={22} className="fill-white drop-shadow-[0_2px_8px_rgba(255,165,0,0.8)]" />
                                  ) : (
                                    <Flame size={20} className={effectiveStreak > 0 ? "fill-white animate-pulse" : ""} />
                                  )}
                               </div>
                               <div className="text-left">
                                  <div className={`text-sm font-black uppercase tracking-wider flex items-center gap-1.5 flex-wrap ${
                                    effectiveStreak > 7 ? 'text-orange-400' : 'text-text'
                                  }`}>
                                     Chuỗi học tập
                                     {effectiveStreak > 7 && (
                                       <span className="text-[9px] uppercase font-black bg-orange-500/20 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-full tracking-wide">
                                         SIÊU VIỆT 🔥
                                       </span>
                                     )}
                                  </div>
                                  <div className="text-[11px] text-muted font-medium mt-0.5 max-w-[200px] sm:max-w-xs leading-tight">
                                    Vượt ải mê cung hàng ngày để tích lũy ngọn lửa hiếu học
                                  </div>
                               </div>
                            </div>
                            
                            <div className="text-right flex flex-col items-end justify-center shrink-0">
                               <div className={`text-2xl font-black tabular-nums tracking-tighter ${
                                 effectiveStreak > 7
                                   ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-300 drop-shadow-[0_2px_10px_rgba(239,68,68,0.2)]'
                                   : 'text-text'
                               }`}>
                                  {effectiveStreak} ngày
                               </div>
                               <button 
                                 type="button"
                                 onClick={() => setSimulateActive(p => !p)} 
                                 className="text-[9px] mt-1 font-black uppercase tracking-wider px-2 py-1 select-none rounded bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-primary/20 hover:text-primary transition-all pointer-events-auto cursor-pointer"
                                 title="Ấn để chuyển đổi giữa chuỗi thực tế và chuỗi mô phỏng siêu việt (>7 ngày)!"
                               >
                                  {simulateActive ? "Thực tế 🔄" : "Chạy thử >7 ngày 🧪"}
                               </button>
                            </div>
                        </div>

                        {/* Interactive Milestone Indicator Tracks */}
                        <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800 relative z-10 grid grid-cols-7 gap-1">
                          {streakMilestones.map((milestone, idx) => {
                            const isAchieved = effectiveStreak >= milestone.days;
                            const isCurrent = effectiveStreak === milestone.days;
                            
                            return (
                              <div key={idx} className="flex flex-col items-center gap-1">
                                <div 
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all text-sm font-bold ${
                                    isAchieved
                                      ? effectiveStreak > 7
                                        ? 'bg-gradient-to-tr from-red-500 to-orange-450 text-white shadow-md'
                                        : 'bg-orange-500 text-white'
                                      : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600'
                                  } ${isCurrent ? 'ring-2 ring-orange-500/50 animate-pulse scale-105' : ''}`}
                                  title={`Cột mốc ${milestone.days} ngày`}
                                >
                                  {milestone.icon}
                                </div>
                                <span className={`text-[9px] font-bold ${isAchieved ? 'text-text opacity-90' : 'text-muted opacity-60'}`}>{milestone.label}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Extra motivational banner for Super Streak */}
                        {effectiveStreak > 7 && (
                          <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-2xl relative z-10 text-left flex items-start gap-2 animate-in slide-in-from-bottom duration-300">
                             <span className="text-xl">🐉</span>
                             <div className="space-y-0.5">
                                <h5 className="text-[11px] font-black uppercase text-yellow-400 tracking-wider">Hào Quang Chí Tôn rực lửa ({effectiveStreak} ngày+)</h5>
                                <p className="text-[10px] text-zinc-300 leading-snug">Bạn đang duy trì một lòng hiếu học phi thường! Ngọn lửa tư duy đang soi sáng toàn bộ học trình.</p>
                             </div>
                          </div>
                        )}
                    </div>

                    <div className="p-4 bg-blue-tint rounded-2xl border border-blue-text/10">
                        <div className="flex items-center gap-2 text-blue-text text-xs font-bold uppercase mb-1">
                            <Target size={16}/>
                            Câu đúng
                        </div>
                        <div className="text-2xl font-bold text-text">{stats.questionsAnswered}</div>
                    </div>

                    <div className="p-4 bg-purple-tint rounded-2xl border border-purple-text/10">
                        <div className="flex items-center gap-2 text-purple-text text-xs font-bold uppercase mb-1">
                            <Brain size={16}/>
                            Màn chơi
                        </div>
                        <div className="text-2xl font-bold text-text">{stats.gamesPlayed}</div>
                    </div>

                    <div className="p-4 bg-orange-tint rounded-2xl border border-orange-text/10">
                        <div className="flex items-center gap-2 text-orange-text text-xs font-bold uppercase mb-1">
                            <Star size={16}/>
                            Tổng XP
                        </div>
                        <div className="text-2xl font-bold text-text">{stats.totalScore.toLocaleString()}</div>
                    </div>

                    <div className="p-4 bg-danger/5 rounded-2xl border border-danger/10">
                        <div className="flex items-center gap-2 text-danger text-xs font-bold uppercase mb-1">
                            <Medal size={16}/>
                            Kỷ lục
                        </div>
                        <div className="text-2xl font-bold text-text">{stats.highScore.toLocaleString()}</div>
                    </div>
                </div>
              </>
            ) : activeSubTab === 'diagnostics' ? (
              <div className="space-y-6">
                {/* Subject Mastery Index Chart */}
                <div className="bg-background/40 hover:bg-background/80 p-5 rounded-2xl border border-border/80 text-left transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xs font-black text-muted uppercase tracking-wider mb-0.5">Năng lực cốt lõi</h4>
                      <h3 className="text-base font-bold text-text flex items-center gap-2">
                        <BarChart2 size={18} className="text-primary" />
                        Chỉ số Môn học (Mastery Index - %)
                      </h3>
                    </div>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={(stats.mastery || []).map(m => ({ name: m.subject, score: m.score }))} 
                        layout="vertical"
                        margin={{ top: 5, right: 15, left: -25, bottom: 5 }}
                      >
                        <XAxis type="number" stroke="#888888" fontSize={9} fontWeight={600} domain={[0, 100]} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#888888" fontSize={9} fontWeight={600} width={100} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--color-surface, #ffffff)',
                            border: '1px solid var(--color-border, #e5e7eb)',
                            borderRadius: '12px',
                            fontSize: '11px',
                          }}
                        />
                        <Bar dataKey="score" name="Năng lực" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={12}>
                          {(stats.mastery || []).map((entry, index) => {
                            const colors = ['#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#10b981', '#14b8a6'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Growth XP Line/Area Chart */}
                <div className="bg-background/40 hover:bg-background/80 p-5 rounded-2xl border border-border/80 text-left transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xs font-black text-muted uppercase tracking-wider mb-0.5">Tích lũy tri thức</h4>
                      <h3 className="text-base font-bold text-text flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-500" />
                        Đường cong tăng trưởng (XP Curve)
                      </h3>
                    </div>
                  </div>

                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={(() => {
                          const todayStr = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                          return (stats.scoreHistory && stats.scoreHistory.length > 0)
                            ? stats.scoreHistory
                            : [
                                { date: '28/05', score: Math.max(0, stats.totalScore - 400) },
                                { date: '29/05', score: Math.max(0, stats.totalScore - 300) },
                                { date: '30/05', score: Math.max(0, stats.totalScore - 150) },
                                { date: '31/05', score: Math.max(0, stats.totalScore - 50) },
                                { date: todayStr, score: stats.totalScore }
                              ];
                        })()} 
                        margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="profileColorXp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229, 231, 235, 0.3)" />
                        <XAxis dataKey="date" stroke="#888888" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} dy={5} />
                        <YAxis stroke="#888888" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--color-surface, #ffffff)',
                            border: '1px solid var(--color-border, #e5e7eb)',
                            borderRadius: '12px',
                            fontSize: '11px',
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          name="Điểm tích lũy" 
                          stroke="#6366f1" 
                          strokeWidth={2.5} 
                          fillOpacity={1} 
                          fill="url(#profileColorXp)" 
                          dot={{ r: 3, strokeWidth: 1, fill: '#ffffff', stroke: '#6366f1' }} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Cognitive Advice & Habit Analysis */}
                <div className="bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent p-5 rounded-2xl border border-purple-500/10 text-left">
                  <h3 className="text-sm font-bold text-text flex items-center gap-2 mb-3">
                    <Brain size={18} className="text-purple-500" />
                    Chẩn đoán Sai lỗi tư duy (Cognitive Analysis)
                  </h3>
                  
                  {(!stats.thinkingErrors || stats.thinkingErrors.length === 0) ? (
                    <div className="p-4 bg-background/20 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center py-6">
                      <Sparkles size={24} className="text-purple-400 animate-pulse mb-2" />
                      <h4 className="font-bold text-xs uppercase text-text tracking-wide mb-1">Logic Vô Song 🧠</h4>
                      <p className="text-[11px] text-muted max-w-xs leading-relaxed">
                        Chưa ghi nhận thói quen lỗi tư duy nào. Tiếp tục giữ vững tư duy nhạy bén khi đối mặt với Boss mê cung nhé!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-muted leading-relaxed">
                        Hệ thống ghi nhận <span className="font-bold text-purple-500">{stats.thinkingErrors.length} thói quen lỗi</span> cần tối ưu hóa:
                      </p>
                      <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                        {stats.thinkingErrors.map((err, idx) => (
                          <div key={idx} className="p-3 bg-background/40 rounded-xl border border-border/50">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-xs text-text">{err.errorType}</span>
                              <span className="text-[10px] uppercase font-black bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full">
                                Cấp {err.count} 📈
                              </span>
                            </div>
                            <p className="text-[11px] text-muted leading-relaxed">{err.shortAnalysis}</p>
                            {err.suggestion && (
                              <div className="mt-1.5 p-1 px-2 border-l-2 border-emerald-500 bg-emerald-500/5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                💡 <strong>Gia sư khuyên:</strong> {err.suggestion}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Developer Credits & Creator Info */}
                <div className="bg-background/60 p-5 rounded-2xl border border-border/80 text-left">
                   <h4 className="text-sm font-bold text-text flex items-center gap-2 mb-2">
                       <Code size={16} className="text-primary" />
                       Nhà phát triển
                   </h4>
                   <p className="text-xs text-muted leading-relaxed">
                     Hệ thống được thiết kế và tối ưu bởi <span className="font-bold text-text">Google Gemini AI</span> kết hợp trợ lý thông minh giúp học tập cá nhân hóa.
                   </p>
                </div>
                <div className="bg-background/60 p-5 rounded-2xl border border-border/80 text-left">
                   <h4 className="text-sm font-bold text-text flex items-center gap-2 mb-3">
                       <Bug size={16} className="text-red-500" />
                       Nhật ký phát triển & Sửa lỗi (Fix Bugs)
                   </h4>
                   <div className="space-y-4 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                       
                       <div className="border-l-2 border-primary pl-3 py-0.5 space-y-1">
                           <div className="flex items-center justify-between">
                               <span className="text-xs font-black text-text font-mono">v1.6.0 (Mới nhất)</span>
                            </div>
                            <p className="text-xs text-muted font-bold">Chẩn đoán học tập trực quan (AI Visual Diagnostics):</p>
                            <ul className="list-disc pl-4 text-[11px] text-muted space-y-1">
                                <li><strong>Chỉ số Năng lực (Mastery Chart):</strong> Thống kê trực quan chỉ số thông thạo từng chủ điểm học tập bằng biểu đồ cột Recharts màu sắc tương tác.</li>
                                <li><strong>Xu hướng Kiến thức (XP Curve):</strong> Khắc họa đồ thị diện tích thông lượng điểm số XP tích lũy mượt mà qua các ngày học tập và vượt ải mê cung.</li>
                                <li><strong>Màng Chẩn Đoán Lỗi Tư Duy:</strong> Tổng hợp đầy đủ các tư duy phán đoán sai lầm trực tiếp liên kết với gia sư tư vấn khuyên dùng của Gemini.</li>
                            </ul>
                       </div>

                       <div className="border-l-2 border-primary/40 pl-3 py-0.5 space-y-1">
                           <div className="flex items-center justify-between">
                               <span className="text-xs font-black text-text font-mono">v1.5.0</span>
                               <span className="text-[9px] bg-muted/20 text-muted px-1.5 py-0.5 rounded font-bold uppercase font-sans">Updated</span>
                            </div>
                            <p className="text-xs text-muted font-bold">AI Giọng Nói & Tương tác thông minh:</p>
                            <ul className="list-disc pl-4 text-[11px] text-muted space-y-1">
                                <li><strong>Gia sư phát âm (AI Voice):</strong> Tích hợp động cơ tái tạo giọng nói Web Speech API, chuyển tư duy phân tích của Gemini và lời giải chi tiết thành tiếng Việt truyền cảm.</li>
                                <li><strong>Trợ lý thoại rảnh tay:</strong> Thiết lập phím tắt nghe đọc thoại trực quan tại mọi bong bóng tin nhắn chat AI di động.</li>
                            </ul>
                       </div>

                       <div className="border-l-2 border-primary/40 pl-3 py-0.5 space-y-1">
                           <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-text font-mono">v1.4.0</span>
                              <span className="text-[9px] bg-muted/20 text-muted px-1.5 py-0.5 rounded font-bold uppercase font-sans">Updated</span>
                           </div>
                           <p className="text-xs text-muted font-bold">Hệ thống đồng hành & Trải nghiệm mới:</p>
                           <ul className="list-disc pl-4 text-[11px] text-muted space-y-1">
                                <li><strong>Nhiệm vụ & Điểm danh:</strong> Thử thách nhận quà (Khiên bảo vệ, gợi ý AI, Xu rực rỡ).</li>
                                <li><strong>Widget Chuỗi Học Tập:</strong> Ngọn lửa rực sáng bập bùng với chế độ giả lập trực quan.</li>
                                <li><strong>Âm thanh sinh động:</strong> Tắt/bật âm thanh linh hoạt tại thanh tiện ích.</li>
                            </ul>
                        </div>

                        <div className="hidden">
                           <div className="flex items-center justify-between">
                               <span className="text-[9px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded font-bold uppercase font-sans">Active</span>
                           </div>
                           <p className="text-xs text-muted font-bold">Hệ thống đồng hành & Trải nghiệm mới:</p>
                           <ul className="list-disc pl-4 text-[11px] text-muted space-y-1">
                               <li><strong>Nhiệm vụ & Điểm danh:</strong> Thử thách nhận quà (Khiên bảo vệ, gợi ý AI, Xu rực rỡ).</li>
                               <li><strong>Widget Chuỗi Học Tập:</strong> Ngọn lửa rực sáng bập bùng với chế độ giả lập trực quan.</li>
                               <li><strong>Âm thanh sinh động:</strong> Tắt/bật âm thanh linh hoạt tại thanh tiện ích.</li>
                           </ul>
                       </div>

                       <div className="border-l-2 border-primary/40 pl-3 py-0.5 space-y-1">
                           <div className="flex items-center justify-between">
                               <span className="text-xs font-black text-text font-mono">v1.3.0</span>
                               <span className="text-[9px] bg-muted/20 text-muted px-1.5 py-0.5 rounded font-bold uppercase font-sans">Updated</span>
                           </div>
                           <p className="text-xs text-muted font-bold">Chẩn đoán tư duy với Thinking Model:</p>
                           <ul className="list-disc pl-4 text-[11px] text-muted space-y-1">
                               <li>Bổ sung tính năng <strong>Phân Tích Tư Duy Chi Tiết</strong> tại từng câu hỏi.</li>
                               <li>Sử dụng mô hình lập luận thế hệ mới <code>gemini-3.1-pro-preview</code> hỗ trợ chẩn đoán học tập.</li>
                           </ul>
                       </div>

                       <div className="border-l-2 border-primary/40 pl-3 py-0.5 space-y-1">
                           <div className="flex items-center justify-between">
                               <span className="text-xs font-black text-text font-mono">v1.2.2</span>
                               <span className="text-[9px] bg-muted/20 text-muted px-1.5 py-0.5 rounded font-bold uppercase font-sans">Updated</span>
                           </div>
                           <p className="text-xs text-muted font-bold">Cập nhật hệ thống thông tin & Credits:</p>
                           <ul className="list-disc pl-4 text-[11px] text-muted space-y-1">
                               <li>Khởi tạo Tab "Cài đặt & Thông tin" tích hợp phân hệ ghi nhận tác giả.</li>
                               <li>Công bố rõ quy trình tối ưu của AI Engine và tinh giản thiết kế Credits.</li>
                           </ul>
                       </div>

                       <div className="border-l-2 border-purple-500/30 pl-3 py-0.5 space-y-1">
                           <div className="flex items-center justify-between">
                               <span className="text-xs font-black text-text font-mono">v1.2.1-fix</span>
                               <span className="text-[9px] bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase font-sans">Bug Fix</span>
                           </div>
                           <p className="text-xs text-muted font-bold">Fix lỗi đồng bộ điểm môn Toán:</p>
                           <ul className="list-disc pl-4 text-[11px] text-muted space-y-1">
                               <li>Vá thành công lỗi hiển thị chỉ số Radar khi thiếu trường Hình học hoặc Đại số.</li>
                               <li>Cải tiến cơ cấu tính điểm Mastery theo mốc Level học tập trực quan.</li>
                           </ul>
                       </div>

                       <div className="border-l-2 border-indigo-500/30 pl-3 py-0.5 space-y-1">
                           <div className="flex items-center justify-between">
                               <span className="text-xs font-black text-text font-mono">v1.2.0</span>
                               <span className="text-[9px] bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase font-sans">Feature</span>
                           </div>
                           <p className="text-xs text-muted font-bold">AI Chẩn đoán lỗi tư duy:</p>
                           <ul className="list-disc pl-4 text-[11px] text-muted space-y-1">
                               <li>Tích hợp mô hình Gemini Pro để phân loại hành thói quen sai sót (Thinking Errors).</li>
                               <li>Tối ưu phân tích hành vi của người dùng trong thời gian thực.</li>
                           </ul>
                       </div>

                   </div>
                </div>

                {/* Proposed Future Upgrades */}
                <div className="bg-background/60 p-5 rounded-2xl border border-border/80 text-left">
                   <h4 className="text-sm font-bold text-text flex items-center gap-2 mb-2">
                       <Wrench size={16} className="text-indigo-500" />
                       Đề xuất nâng cấp tiếp theo (Proposed Upgrades)
                   </h4>
                   <div className="space-y-2 text-xs text-muted leading-relaxed">
                       <div className="flex items-start gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                           <p><strong>Cá nhân hóa lộ trình:</strong> Đề xuất trực tiếp các bài tập tương thích dựa trên các lỗ hổng kiến thức được chỉ ra từ "Phân Tích Tư Duy".</p>
                       </div>
                       <div className="flex items-start gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                           <p><strong>Đấu đối kháng (Multiplayer Duel):</strong> Thách đấu bạn bè trực tiếp thời gian thực, rèn luyện kỹ năng giải bài nhanh và cướp kho báu mê cung.</p>
                       </div>
                       <div className="flex items-start gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                           <p><strong>Hệ thống Vinh danh (Leaderboard & Quests):</strong> Thêm bảng xếp hạng theo tuần và các nhiệm vụ hàng ngày phong phú hơn.</p>
                       </div>
                   </div>
                </div>

                {/* Data Management */}
                <div className="bg-surface border border-border rounded-2xl p-5 text-left">
                    <h4 className="text-sm font-bold text-text flex items-center gap-2 mb-3">
                        <HardDrive size={16} className="text-muted" />
                        Quản lý dữ liệu hệ thống (Local)
                    </h4>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleExport}
                            className="flex-1 btn-primary py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                        >
                            <Download size={16}/>
                            Sao lưu
                        </button>
                        
                        <div className="flex-1 relative">
                            <input 
                                type="file" 
                                accept=".json" 
                                onChange={handleImport}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={isImporting}
                            />
                            <button 
                                className="w-full h-full bg-surface border border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 text-primary py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                                disabled={isImporting}
                            >
                                {isImporting ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>}
                                {isImporting ? 'Đang xử lý...' : 'Khôi phục'}
                            </button>
                        </div>
                    </div>
                 </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;