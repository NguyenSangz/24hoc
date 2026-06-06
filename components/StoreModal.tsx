
import React, { useState, useEffect } from 'react';
import { User, ItemType } from '../types';
import { getInventory, updateInventory, Inventory } from '../utils/storage';
import { X, ShoppingBag, Zap, Coins, Bot, Sparkles, Search, ArrowRight, Shield, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StoreModalProps {
  user: User;
  onClose: () => void;
}

const StoreModal: React.FC<StoreModalProps> = ({ user, onClose }) => {
  const [inventory, setInventory] = useState<Inventory>({ coins: 0, items: {} });
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
      const loadInv = async () => {
          const inv = await getInventory(user.username);
          setInventory(inv);
      };
      loadInv();
  }, [user.username]);

  const ITEMS: { type: ItemType; name: string; description: string; cost: number; icon: React.ReactNode, color: string }[] = [
    {
      type: 'AI_HINT',
      name: 'Gợi ý AI thông thái',
      description: 'Nhận ngay một gợi ý tinh tế từ AI để thu hẹp phạm vi đáp án đúng.',
      cost: 20,
      icon: <Zap size={24} />,
      color: 'bg-orange-500'
    },
    {
      type: 'SHIELD',
      name: 'Khiên Bảo Vệ',
      description: 'Bảo vệ bạn khỏi một câu trả lời sai. Rất hữu ích trong chế độ sinh tồn.',
      cost: 50,
      icon: <Shield size={24} />,
      color: 'bg-blue-500'
    },
    {
      type: 'AI_TICKET',
      name: 'Thẻ AI Master',
      description: 'Mở khóa ngay đáp án đúng + Lời giải chi tiết từ chuyên gia AI.',
      cost: 100,
      icon: <Bot size={24} />,
      color: 'bg-purple-500'
    }
  ];

  const handleBuy = async (item: typeof ITEMS[0]) => {
    if (inventory.coins >= item.cost) {
      const newInventory = { ...inventory };
      newInventory.coins -= item.cost;
      newInventory.items[item.type] = (newInventory.items[item.type] || 0) + 1;
      
      await updateInventory(user.username, newInventory);
      setInventory(newInventory);
      
      setMessage({ text: `Đã mua ${item.name}!`, type: 'success' });
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage({ text: 'Số dư không đủ!', type: 'error' });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="bg-surface w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]"
      >
        
        {/* Header */}
        <div className="px-6 md:px-8 py-4 md:py-6 bg-background/50 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-3 md:gap-4">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
               <ShoppingBag size={20} className="md:w-[24px] md:h-[24px]" />
             </div>
             <div>
                <h3 className="text-lg md:text-xl font-display font-bold text-text">Cửa hàng Vật phẩm</h3>
                <p className="text-[9px] md:text-[10px] font-black text-muted uppercase tracking-widest">Trang bị cho hành trình của bạn</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-muted hover:text-text transition-colors"
          >
             <X size={18} className="md:w-[20px] md:h-[20px]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-background/30">
           
           {/* Store Banner Image */}
           <div className="mb-6 md:mb-8 w-full h-28 md:h-32 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative border border-border bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <ShoppingBag size={60} className="text-primary/40 md:w-[80px] md:h-[80px]" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-6 md:px-8">
                 <div className="text-white">
                    <h4 className="text-xl md:text-2xl font-display font-bold">Ưu đãi AI đặc biệt</h4>
                    <p className="text-[10px] md:text-xs font-medium opacity-80">Trang bị ngay để chinh phục mọi thử thách</p>
                 </div>
              </div>
           </div>

           {/* Wallet */}
           <div className="mb-8 md:mb-10 flex flex-col sm:flex-row items-center justify-between bg-zinc-900 text-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl relative overflow-hidden gap-6">
              <div className="relative z-10 text-center sm:text-left">
                <span className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1 block">Số dư hiện tại</span>
                <div className="flex items-center justify-center sm:justify-start gap-2 md:gap-3 text-3xl md:text-4xl font-display font-bold">
                   <Coins size={28} className="text-yellow-500 fill-yellow-500 md:w-[32px] md:h-[32px]"/>
                   {inventory.coins.toLocaleString()}
                </div>
              </div>
              <div className="relative z-10 w-full sm:w-auto">
                <button className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-all border border-white/10">
                  Nạp thêm xu
                </button>
              </div>
              
              {/* Decorative */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
           </div>

           <AnimatePresence>
             {message && (
               <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className={`mb-6 p-4 rounded-2xl text-center text-sm font-black uppercase tracking-widest ${
                   message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
                 }`}
               >
                 {message.text}
               </motion.div>
             )}
           </AnimatePresence>

           <div className="grid grid-cols-1 gap-4 md:gap-6">
              {ITEMS.map((item, i) => {
                const count = inventory.items[item.type] || 0;
                const canBuy = inventory.coins >= item.cost;

                return (
                  <motion.div 
                    key={item.type}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-surface p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-border flex flex-col sm:flex-row items-center gap-4 md:gap-6 hover:border-primary/30 transition-all shadow-sm group"
                  >
                     <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl md:rounded-3xl ${item.color} text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}>
                        {item.icon}
                     </div>
                     
                     <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1 md:mb-2">
                            <h4 className="font-display font-bold text-text text-lg md:text-xl">{item.name}</h4>
                            <div className="inline-flex self-center sm:self-auto text-[9px] md:text-[10px] font-black px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-muted uppercase tracking-widest">
                                Đang có: {count}
                            </div>
                        </div>
                        <p className="text-xs md:text-sm text-muted font-medium leading-relaxed">{item.description}</p>
                     </div>

                     <div className="flex flex-col items-center gap-2 md:gap-3 min-w-[120px] md:min-w-[140px] w-full sm:w-auto">
                        <div className="font-display font-bold text-yellow-600 flex items-center gap-2">
                           <span className="text-xl md:text-2xl">{item.cost}</span>
                           <span className="text-[10px] font-black uppercase tracking-widest">xu</span>
                        </div>
                        <button
                           onClick={() => handleBuy(item)}
                           disabled={!canBuy}
                           className={`w-full px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${
                             canBuy 
                             ? 'bg-primary text-primary-text hover:bg-secondary shadow-lg shadow-primary/20 hover:scale-105' 
                             : 'bg-zinc-100 dark:bg-zinc-800 text-muted cursor-not-allowed opacity-50'
                           }`}
                        >
                           MUA NGAY
                        </button>
                     </div>
                  </motion.div>
                );
              })}
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StoreModal;
