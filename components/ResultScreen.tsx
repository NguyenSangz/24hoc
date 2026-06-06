import React from 'react';
import { CheckCircle, AlertCircle, RotateCcw, Home, Trophy, XCircle, Clock, HeartCrack, Zap, Coins, Sparkles, ArrowRight, Target } from 'lucide-react';
import { GameOverReason } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultScreenProps {
  type: 'VICTORY' | 'GAME_OVER';
  score: number;
  reason: GameOverReason;
  onRetry: () => void;
  onExit: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ type, score, reason, onRetry, onExit }) => {
  const isVictory = type === 'VICTORY';

  const getReasonInfo = () => {
    if (isVictory) {
      return {
        title: 'CHINH PHỤC THÀNH CÔNG',
        description: 'Bạn đã xuất sắc vượt qua mọi thử thách trong mê cung tri thức này. Một bộ não thực thụ!',
        icon: <Trophy size={64} />,
        colorClass: 'text-yellow-500 bg-yellow-500/10 shadow-yellow-500/20',
        extraClass: '',
      };
    }

    switch (reason) {
      case 'TIMEOUT':
        return {
          title: 'HẾT THỜI GIAN',
          description: 'Rất tiếc, thời gian đã cạn kiệt trước khi bạn kịp chạm tới đích. Hãy nhanh tay hơn lần sau!',
          icon: <Clock size={64} />,
          colorClass: 'text-orange-500 bg-orange-500/10 shadow-orange-500/20',
          extraClass: 'animate-shake',
        };
      case 'SUDDEN_DEATH':
        return {
          title: 'CHẾ ĐỘ SINH TỒN',
          description: 'Chỉ một sai lầm nhỏ đã khiến hành trình kết thúc. Chế độ sinh tồn không chấp nhận sai sót!',
          icon: <Zap size={64} />,
          colorClass: 'text-red-500 bg-red-500/10 shadow-red-500/20',
          extraClass: '',
        };
      case 'NO_HEARTS':
      default:
        return {
          title: 'CẠN KIỆT SINH LỰC',
          description: 'Bạn đã dùng hết số lượt thử cho phép. Đừng nản chí, thất bại là mẹ thành công!',
          icon: <HeartCrack size={64} />,
          colorClass: 'text-red-500 bg-red-500/10 shadow-red-500/20',
          extraClass: '',
        };
    }
  };

  const info = getReasonInfo();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl z-40"
    >
      <motion.div 
        initial={{ scale: 0.8, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className={`bg-surface p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl max-w-xl w-full text-center border border-border relative overflow-hidden ${info.extraClass || ''}`}
      >
        {/* Decorative background elements */}
        <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-20 ${isVictory ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
        <div className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-[100px] opacity-10 ${isVictory ? 'bg-primary' : 'bg-orange-500'}`}></div>

        <motion.div 
          initial={{ rotate: -10, scale: 0.5 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className={`mx-auto w-24 h-24 md:w-32 md:h-32 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mb-6 md:mb-8 shadow-2xl ${info.colorClass}`}
        >
          {React.cloneElement(info.icon as React.ReactElement<any>, { size: 48, className: 'md:w-[64px] md:h-[64px]' })}
        </motion.div>

        <div className="mb-6 md:mb-8 w-full h-32 md:h-40 rounded-2xl md:rounded-3xl overflow-hidden border border-border relative bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
           {isVictory ? <Trophy size={60} className="text-yellow-500/40 md:w-[80px] md:h-[80px]" /> : <Target size={60} className="text-red-500/40 md:w-[80px] md:h-[80px]" />}
           <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text mb-3 md:mb-4 tracking-tight">
            {info.title}
          </h2>
          <p className="text-muted mb-8 md:mb-10 text-base md:text-lg leading-relaxed font-medium px-2 md:px-4">
            {info.description}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-background p-4 md:p-6 rounded-2xl md:rounded-3xl border border-border shadow-sm"
          >
            <div className="flex items-center justify-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] text-muted uppercase font-black tracking-widest mb-1 md:mb-2">
              <Trophy size={12} className="md:w-[14px] md:h-[14px]" />
              Tổng điểm
            </div>
            <div className="text-2xl md:text-4xl font-display font-bold text-primary">{score.toLocaleString()}</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-background p-4 md:p-6 rounded-2xl md:rounded-3xl border border-border shadow-sm"
          >
            <div className="flex items-center justify-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] text-muted uppercase font-black tracking-widest mb-1 md:mb-2">
              <Sparkles size={12} className="md:w-[14px] md:h-[14px]" />
              Thưởng xu
            </div>
            <div className="text-2xl md:text-4xl font-display font-bold text-yellow-600">+{isVictory ? '500' : '50'}</div>
          </motion.div>
        </div>

        <div className="flex flex-col gap-3 md:gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="w-full btn-primary py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 group"
          >
            <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500 md:w-[24px] md:h-[24px]" />
            CHƠI LẠI NGAY
          </motion.button>
          
          <motion.button 
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
            onClick={onExit}
            className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl font-bold text-muted hover:text-text transition-all flex items-center justify-center gap-3 border-2 border-transparent hover:border-border text-sm md:text-base"
          >
            <Home size={18} className="md:w-[22px] md:h-[22px]" />
            VỀ TRANG CHỦ
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultScreen;
