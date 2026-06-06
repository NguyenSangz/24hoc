import React from 'react';
import { GraduationCap, Brain, Target, Trophy, Star, ArrowRight, Users, Moon, Sun, Sparkles, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onStart: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, isDark, toggleTheme }) => {
  return (
    <div className="min-h-screen bg-background text-text font-sans overflow-x-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 text-primary font-display font-bold text-2xl tracking-tight">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-text shadow-lg shadow-primary/20">
              <GraduationCap size={24} />
            </div>
            <span>24hoc</span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
              <a href="#features" className="hover:text-primary transition-colors">Tính năng</a>
              <a href="#reviews" className="hover:text-primary transition-colors">Đánh giá</a>
            </nav>
            <div className="h-6 w-px bg-border hidden md:block"></div>
            <button
              onClick={toggleTheme}
              className="p-2.5 text-muted hover:text-primary hover:bg-primary/5 transition-all rounded-xl border border-transparent hover:border-primary/20"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={onStart}
              className="btn-primary px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-primary/20"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section - Editorial Style */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-8 border border-primary/20 shadow-sm animate-bounce">
              <Sparkles size={14} className="fill-current text-amber-500" />
              <span>Kỷ nguyên học tập tinh tú với AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black mb-6 md:mb-8 leading-[0.9] tracking-tighter text-text">
              HỌC TẬP <br/>
              <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-primary to-orange-500">KHÔNG GIỚI HẠN</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted mb-8 md:mb-10 max-w-xl leading-relaxed">
              Phác họa lộ trình học tập tối hiển bởi trí tuệ nhân tạo. Chinh phục mê cung tri thức sống động, bồi dưỡng thói quen rèn luyện bền bỉ mỗi ngày.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              <button 
                onClick={onStart}
                className="w-full sm:w-auto btn-primary px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-base md:text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 group border border-primary/10"
              >
                Bắt đầu hành trình
                <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
              </button>
              <div className="flex items-center gap-4 px-2 py-2 bg-surface/50 border border-border/80 rounded-2xl backdrop-blur-md">
                <div className="flex -space-x-3">
                  {[
                    { bg: 'bg-red-500/20 text-red-600', char: 'A' },
                    { bg: 'bg-emerald-500/20 text-emerald-600', char: 'B' },
                    { bg: 'bg-indigo-500/20 text-indigo-600', char: 'C' }
                  ].map((usr, i) => (
                    <div key={i} className={`w-9 h-9 rounded-full border-2 border-surface ${usr.bg} flex items-center justify-center text-xs font-black shadow-sm`}>
                      {usr.char}
                    </div>
                  ))}
                  <div className="w-9 h-9 rounded-full border-2 border-surface bg-primary text-primary-text flex items-center justify-center text-[10px] font-black shadow-md">
                    +2k
                  </div>
                </div>
                <div className="text-xs font-bold text-muted-foreground">
                  Được tin dùng bởi <span className="text-text font-black">2,000+</span> học sinh
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden border-8 border-surface shadow-2xl shadow-primary/10">
              <div className="w-full h-full aspect-[4/5] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center relative group">
                {/* Visual ambient rings */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                <div className="absolute w-[80%] h-[80%] border-2 border-white/20 rounded-[2rem] transition-all group-hover:scale-105 duration-700"></div>
                <div className="absolute w-[60%] h-[60%] border border-white/10 rounded-[1.5rem] animate-pulse"></div>

                <div className="flex flex-col items-center gap-4 z-10 text-white">
                  <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl animate-bounce">
                    <GraduationCap size={48} className="text-white drop-shadow-md" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs uppercase tracking-[0.3em] font-black bg-white/20 px-3 py-1 rounded-full text-white">Chương trình 2026</span>
                    <h4 className="text-2xl font-black mt-2 font-display">KHAI PHÓNG TRÍ LỰC</h4>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white z-20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <span className="text-xs font-black uppercase tracking-widest opacity-90 text-emerald-300">Đang hoạt động</span>
                </div>
                <h3 className="text-2xl font-black font-display tracking-tight">Mê cung Toán học THCS</h3>
                <p className="text-xs opacity-80 mt-1 font-medium">Khám phá vũ trụ kiến trúc học tập thông minh bậc nhất.</p>
              </div>
            </div>
            
            {/* Floating Elements */}
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 px-6 py-5 bg-surface rounded-3xl shadow-xl border border-border flex flex-col items-center justify-center gap-1 z-20"
            >
              <Trophy size={36} className="text-amber-500 filter drop-shadow-md" />
              <span className="text-xs font-black tracking-tight mt-1 text-text">Bảng Vàng</span>
              <span className="text-[10px] font-bold text-muted">Học Sinh Giỏi</span>
            </motion.div>
            
            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-6 -left-10 w-44 bg-surface rounded-3xl shadow-xl border border-border p-5 flex flex-col justify-center gap-2.5 z-20"
            >
              <div className="flex items-center gap-2">
                <Brain size={20} className="text-primary animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-text">Tính toán AI</span>
              </div>
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <motion.div 
                  animate={{ width: ["20%", "85%", "45%", "95%", "20%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-primary to-orange-500"
                ></motion.div>
              </div>
              <span className="text-[9px] font-bold text-muted uppercase tracking-widest leading-none">Cá nhân hóa 100%</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="bg-surface border-y border-border py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {[
            { label: "Câu hỏi AI", value: "50,000+", icon: Brain },
            { label: "Học sinh", value: "10,000+", icon: Users },
            { label: "Độ chính xác", value: "100%", icon: Target },
            { label: "Đánh giá", value: "4.9/5", icon: Star },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-display font-bold text-text mb-1">{stat.value}</div>
              <div className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features - Grid Layout */}
      <section id="features" className="py-20 md:py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-xs md:text-sm font-bold text-primary uppercase tracking-[0.3em] mb-4">Tại sao chọn 24hoc?</h2>
          <p className="text-3xl md:text-5xl font-display font-bold tracking-tight">Trải nghiệm học tập <br/> mang tính đột phá</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              title: "Mê cung Tri thức",
              desc: "Học tập thông qua việc khám phá. Mỗi câu trả lời đúng mở ra một con đường mới trong mê cung.",
              icon: Zap,
              color: "text-blue-text",
              light: "bg-blue-tint"
            },
            {
              title: "AI Pro Thinking",
              desc: "Sử dụng mô hình Gemini 3 Pro để tạo ra các câu hỏi sát thực tế và giải thích chuyên sâu 100% chính xác.",
              icon: Brain,
              color: "text-purple-text",
              light: "bg-purple-tint"
            },
            {
              title: "Cá nhân hóa",
              desc: "Hệ thống tự động điều chỉnh độ khó dựa trên năng lực của bạn, giúp bạn tiến bộ nhanh nhất.",
              icon: Target,
              color: "text-emerald-text",
              light: "bg-emerald-tint"
            }
          ].map((f, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="p-10 rounded-[2rem] bg-surface border border-border hover:border-primary/30 transition-all group"
            >
              <div className={`w-16 h-16 rounded-2xl ${f.light} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <f.icon size={32} className={f.color} />
              </div>
              <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
              <p className="text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Split Section */}
      <section className="bg-surface py-32 overflow-hidden border-y border-border">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="aspect-square rounded-[3rem] overflow-hidden border-4 border-white/10 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Brain size={160} className="text-primary/40" />
            </div>
            <div className="absolute -bottom-10 -right-10 p-8 bg-primary text-primary-text rounded-[2rem] shadow-2xl">
              <div className="text-4xl font-bold mb-1">98%</div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">Tỉ lệ tiến bộ</div>
            </div>
          </div>
          
          <div>
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-8 leading-tight">
              Công nghệ AI <br/> dẫn đầu xu hướng
            </h2>
            <p className="text-xl text-muted mb-12 leading-relaxed">
              Chúng tôi tích hợp những mô hình ngôn ngữ lớn nhất thế giới để đảm bảo mọi kiến thức bạn nhận được đều là chuẩn xác nhất.
            </p>
            
            <div className="space-y-6">
              {[
                { title: "Grounding với Google Search", icon: Shield },
                { title: "Phân tích tư duy sâu", icon: Brain },
                { title: "Hỗ trợ đa phương tiện", icon: Zap },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon size={20} className="text-primary" />
                  </div>
                  <span className="font-bold">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 text-primary font-display font-bold text-2xl mb-6">
                <GraduationCap size={32} />
                <span>24hoc</span>
              </div>
              <p className="text-muted max-w-sm">
                Nền tảng học tập thông minh giúp học sinh Việt Nam chinh phục tri thức một cách hào hứng nhất.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Liên kết</h4>
              <ul className="space-y-4 text-sm text-muted">
                <li><a href="#" className="hover:text-primary transition-colors">Trang chủ</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">Tính năng</a></li>
                <li><a href="#reviews" className="hover:text-primary transition-colors">Đánh giá</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Pháp lý</h4>
              <ul className="space-y-4 text-sm text-muted">
                <li><a href="#" className="hover:text-primary transition-colors">Điều khoản</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Bảo mật</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted font-medium">© 2025 24hoc. All rights reserved.</p>
            <div className="flex gap-6">
              <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-primary hover:text-primary-text transition-all cursor-pointer">
                <Users size={14} />
              </div>
              <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-primary hover:text-primary-text transition-all cursor-pointer">
                <Star size={14} />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
