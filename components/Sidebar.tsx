import React from 'react';
import { 
  LayoutDashboard, 
  Gamepad2, 
  Library, 
  ShoppingBag, 
  Trophy, 
  Settings, 
  LogOut, 
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabType } from './WelcomeScreen';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
  onProfileClick: () => void;
  user: { displayName: string; username: string };
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  soundMuted: boolean;
  onToggleSound: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  onLogout, 
  onProfileClick,
  user,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  soundMuted,
  onToggleSound
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'practice', label: 'Luyện tập', icon: Gamepad2 },
    { id: 'documents', label: 'Tài liệu', icon: Library },
    { id: 'shop', label: 'Cửa hàng', icon: ShoppingBag },
    { id: 'leaderboard', label: 'Bảng xếp hạng', icon: Trophy },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface border-r border-border shadow-soft">
      {/* Brand */}
      <div className={`h-20 flex items-center px-6 border-b border-border transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-primary-text rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <GraduationCap size={24} />
          </div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-display font-black text-2xl text-primary tracking-tighter"
            >
              24hoc
            </motion.span>
          )}
        </div>
        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 text-muted hover:text-primary hover:bg-background rounded-lg lg:flex hidden"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id as TabType);
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative ${
                isActive 
                ? 'bg-primary text-primary-text shadow-md shadow-primary/25' 
                : 'text-muted hover:text-text hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={22} className={isActive ? 'text-primary-text' : 'text-muted group-hover:text-primary'} />
              {!isCollapsed && (
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              )}
              {isActive && !isCollapsed && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-text"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User & Footer */}
      <div className="p-3 border-t border-border space-y-1.5">
        <button
          onClick={onProfileClick}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted hover:text-text transition-all ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-primary">
            {user.displayName.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="flex-1 text-left truncate">
              <p className="text-xs font-black uppercase tracking-widest leading-none mb-1 opacity-50">Tài khoản</p>
              <p className="font-bold text-sm truncate">{user.displayName}</p>
            </div>
          )}
        </button>

        <button
          onClick={onToggleSound}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted hover:text-text transition-all ${isCollapsed ? 'justify-center' : ''}`}
          title={soundMuted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {soundMuted ? <VolumeX size={22} className="text-muted opacity-60" /> : <Volume2 size={22} className="text-primary animate-pulse" />}
          {!isCollapsed && <span className="font-bold text-sm tracking-tight">{soundMuted ? "Âm thanh: Tắt" : "Âm thanh: Bật"}</span>}
        </button>

        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={22} />
          {!isCollapsed && <span className="font-bold text-sm tracking-tight">Đăng xuất</span>}
        </button>
      </div>

      {isCollapsed && (
        <button 
          onClick={() => setIsCollapsed(false)}
          className="absolute -right-3 top-24 w-6 h-6 bg-surface border border-border shadow-md rounded-full flex items-center justify-center text-muted hover:text-primary lg:flex hidden"
        >
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:block h-screen fixed left-0 top-0 z-30 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-72 max-w-[80vw]"
            >
              {sidebarContent}
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 -right-12 w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-text shadow-xl"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Top Bar */}
      <header className="lg:hidden h-16 bg-surface border-b border-border sticky top-0 z-40 flex items-center justify-between px-4">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-muted hover:text-primary"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <GraduationCap className="text-primary" size={24} />
          <span className="font-display font-black text-xl text-primary">24hoc</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>
    </>
  );
};

export default Sidebar;
