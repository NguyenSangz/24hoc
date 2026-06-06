import React, { useState } from 'react';
import { User } from '../types';
import { auth } from '../utils/storage';
import { UserPlus, LogIn, GraduationCap, Lock, User as UserIcon, CheckSquare, Square, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (isLogin) {
      if (!username || !password) {
        setError('Vui lòng nhập tài khoản và mật khẩu.');
        setLoading(false);
        return;
      }
      const user = await auth.login(username, password, rememberMe);
      if (user) {
        onLogin(user);
      } else {
        setError('Tài khoản hoặc mật khẩu không chính xác.');
        setLoading(false);
      }
    } else {
      if (!username || !password || !displayName) {
        setError('Vui lòng nhập đầy đủ thông tin.');
        setLoading(false);
        return;
      }
      const success = await auth.register(username, password, displayName);
      if (success) {
        setIsLogin(true);
        setPassword(''); // Clear password after register
        setError('');
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
        setLoading(false);
      } else {
        setError('Tên đăng nhập đã tồn tại.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative overflow-hidden">
      {/* Decorative Blur Elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[140px] -translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[120px] translate-y-1/2 translate-x-1/2"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center relative z-10"
      >
        <div className="inline-flex p-5 bg-surface rounded-[2rem] shadow-xl shadow-primary/10 mb-6 border border-border">
           <GraduationCap size={48} className="text-primary"/>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-black text-text tracking-tighter">24hoc AI</h1>
        <p className="text-muted font-bold uppercase tracking-[0.4em] text-[10px] mt-3 opacity-60">Gia sư tri thức nhân tạo</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md card p-8 sm:p-10 rounded-[2.5rem] shadow-2xl relative z-10 bg-surface/90 backdrop-blur-xl border border-border/80 hover:border-primary/20 transition-all duration-300 shadow-primary/5"
      >
        <div className="flex mb-10 p-1.5 bg-background dark:bg-zinc-950 rounded-2xl border border-border">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl ${
              isLogin ? 'bg-primary text-primary-text shadow-lg shadow-primary/25' : 'text-muted hover:text-text'
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl ${
              !isLogin ? 'bg-primary text-primary-text shadow-lg shadow-primary/25' : 'text-muted hover:text-text'
            }`}
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Tài khoản</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-indigo-500 transition-colors">
                <UserIcon size={20} />
              </div>
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-border bg-background dark:bg-zinc-950 text-text focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium font-sans"
                placeholder="Ví dụ: hocsinh01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Mật khẩu</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-indigo-500 transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                name="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-border bg-background dark:bg-zinc-950 text-text focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium font-sans"
                placeholder="••••••••"
              />
            </div>
          </div>

          {!isLogin && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Tên hiển thị</label>
              <input
                type="text"
                name="displayName"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border-2 border-border bg-background/50 text-text focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                placeholder="Tên của bạn"
              />
            </motion.div>
          )}

          {isLogin && (
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
               <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'border-border bg-background'}`}>
                  {rememberMe && <CheckSquare size={14} className="text-primary-text" />}
               </div>
               <span className="text-sm font-bold text-muted group-hover:text-text select-none transition-colors">Ghi nhớ đăng nhập</span>
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-red-500/10 text-red-500 text-xs font-bold rounded-2xl flex items-center gap-3 border border-red-500/20"
            >
              <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] shrink-0">!</div>
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-text rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-70 shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-all mt-4"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                {isLogin ? 'Đăng nhập ngay' : 'Tạo tài khoản'}
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
      
      <p className="mt-12 text-[10px] font-black text-muted uppercase tracking-[0.3em] relative z-10 opacity-40">© 2025 24hoc Professional</p>
    </div>
  );
};

export default AuthScreen;