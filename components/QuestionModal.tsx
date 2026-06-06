
import React, { useState, useEffect } from 'react';
import { Question, NodeType } from '../types';
import { X, CheckCircle, XCircle, Eye, Bot, Sparkles, Video, Skull, Shield, Zap, Clock, Brain, Loader2, ArrowRight, Coins, Trophy, Volume2, VolumeX } from 'lucide-react';
import { auth, getInventory, updateInventory, statsStorage } from '../utils/storage';
import { sound } from '../utils/audio';
import { getDeepExplanation, getAIHint, getAILearningHistoryThinkingAnalysis } from '../services/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Markdown from 'react-markdown';

interface QuestionModalProps {
  question: Question;
  onAnswer: (isCorrect: boolean, selectedOptionIndex?: number | null) => void;
  onClose: () => void;
  isReview?: boolean;
  nodeType?: NodeType;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ question, onAnswer, onClose, isReview = false, nodeType = NodeType.NORMAL }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [deepHelp, setDeepHelp] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [inventory, setInventory] = useState({ coins: 0, items: {} as any });
  const [thinkingAnalysis, setThinkingAnalysis] = useState<string | null>(null);
  const [isAnalyzingThinking, setIsAnalyzingThinking] = useState(false);
  const [thinkingErrors, setThinkingErrors] = useState<any[]>([]);
  const [activeSpeechText, setActiveSpeechText] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = (textToSpeak: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error("Trình duyệt của bạn không hỗ trợ phát giọng nói.");
      return;
    }

    if (activeSpeechText === textToSpeak) {
      window.speechSynthesis.cancel();
      setActiveSpeechText(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Remove markdown symbols for clear, smooth spoken text
    let cleanText = textToSpeak
      .replace(/[*#_`~[\]()\-]/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .substring(0, 800); 

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'vi-VN';

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VI'));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onend = () => {
      setActiveSpeechText(null);
    };
    utterance.onerror = () => {
      setActiveSpeechText(null);
    };

    setActiveSpeechText(textToSpeak);
    window.speechSynthesis.speak(utterance);
  };

  const isBoss = nodeType === NodeType.BOSS;

  useEffect(() => {
    const loadInv = async () => {
        const user = auth.getCurrentUser();
        if (user) {
            const inv = await getInventory(user.username);
            setInventory(inv);
            const stats = await statsStorage.getStats(user.username);
            setThinkingErrors(stats?.thinkingErrors || []);
        }
    };
    loadInv();
  }, [question.id]);

  const handleAskAI = async () => {
    if (inventory.coins < 50 && !isReview) {
        toast.error("Bạn cần ít nhất 50 xu để sử dụng tư duy sâu!");
        return;
    }
    
    setIsThinking(true);
    const result = await getDeepExplanation(question, selectedOption !== null ? question.options[selectedOption] : "Chưa chọn");
    setDeepHelp(result);
    setIsThinking(false);

    if (!isReview) {
        const user = auth.getCurrentUser();
        if (user) {
            const newInv = { ...inventory, coins: inventory.coins - 50 };
            await updateInventory(user.username, newInv);
            setInventory(newInv);
        }
    }
  };

  const handleUseHint = async () => {
    if ((inventory.items['AI_HINT'] || 0) <= 0) {
        toast.error("Bạn không có Gợi ý AI! Hãy mua trong cửa hàng.");
        return;
    }
    
    setIsHintLoading(true);
    const result = await getAIHint(question);
    setHint(result);
    setIsHintLoading(false);

    const user = auth.getCurrentUser();
    if (user) {
        const newInv = { ...inventory };
        newInv.items['AI_HINT'] = (newInv.items['AI_HINT'] || 0) - 1;
        await updateInventory(user.username, newInv);
        setInventory(newInv);
    }
  };

  const handleAnalyzeThinking = async () => {
    const chosenAnsText = selectedOption !== null ? question.options[selectedOption] : "Chưa chọn";
    setIsAnalyzingThinking(true);
    setThinkingAnalysis(null);
    try {
      const result = await getAILearningHistoryThinkingAnalysis(question, chosenAnsText, thinkingErrors);
      setThinkingAnalysis(result);
    } catch (err) {
      console.error(err);
      toast.error("Không thể kết nối đến AI Phân Tích Tư Duy.");
    } finally {
      setIsAnalyzingThinking(false);
    }
  };

  const isCorrect = selectedOption === question.correctAnswerIndex;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ 
          scale: 1, 
          y: 0, 
          opacity: 1,
          x: isBoss && isSubmitted && !isCorrect ? [0, -10, 10, -10, 10, 0] : 0
        }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 300,
          x: { duration: 0.5 }
        }}
        className={`w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border transition-all duration-500 ${
          isBoss 
            ? 'bg-zinc-950 border-red-500/50 shadow-red-500/20' 
            : 'bg-surface border-border shadow-black/20'
        }`}
      >
        
        <div className={`px-4 md:px-8 py-4 md:py-6 flex justify-between items-center border-b ${
          isBoss ? 'border-red-900/30 bg-red-950/40' : 'bg-background/50'
        }`}>
          <div className="flex items-center gap-3 md:gap-4">
             <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center ${
               isBoss ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-primary/10 text-primary'
             }`}>
               {isBoss ? <Skull size={20} className="animate-pulse md:w-[24px] md:h-[24px]" /> : <Brain size={20} className="md:w-[24px] md:h-[24px]" />}
             </div>
             <div>
               <h3 className={`font-display font-bold text-base md:text-lg leading-none ${isBoss ? 'text-white' : 'text-text'}`}>
                 {isBoss ? 'TRÙM CUỐI' : `Phòng ${question.id}`}
               </h3>
               <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1 ${isBoss ? 'text-red-400' : 'text-muted'}`}>
                 {isBoss ? 'Cảnh báo: Cực khó' : question.topic}
               </p>
             </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
              <button 
                onClick={handleUseHint}
                disabled={isHintLoading || isSubmitted || isReview || (inventory.items['AI_HINT'] || 0) <= 0}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-orange-500/20 transition-all disabled:opacity-30 border border-orange-500/20"
              >
                {isHintLoading ? <Loader2 size={14} className="animate-spin"/> : <Zap size={14}/>}
                <span className="hidden xs:inline">GỢI Ý ({inventory.items['AI_HINT'] || 0})</span>
                <span className="xs:hidden">{inventory.items['AI_HINT'] || 0}</span>
              </button>
              <button 
                onClick={handleAskAI}
                disabled={isThinking}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-30 border border-primary/20"
              >
                {isThinking ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                <span className="hidden xs:inline">TƯ DUY SÂU</span>
              </button>
              <button 
                onClick={handleAnalyzeThinking}
                disabled={isAnalyzingThinking || !(isSubmitted || isReview)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-purple-500/10 text-purple-500 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all disabled:opacity-30 border border-purple-500/20"
                title={!(isSubmitted || isReview) ? "Hãy trả lời/xác nhận đáp án trước!" : "Phân tích tư duy dựa theo lịch sử lỗi sai"}
              >
                {isAnalyzingThinking ? <Loader2 size={14} className="animate-spin"/> : <Brain size={14}/>}
                <span className="hidden xs:inline">PHÂN TÍCH TƯ DUY</span>
              </button>
              <button 
                onClick={onClose} 
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-muted hover:text-text transition-colors"
              >
                <X size={18} className="md:w-[20px] md:h-[20px]"/>
              </button>
          </div>
        </div>

        <div className="p-6 md:p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
           {/* Question Illustration */}
           <div className="mb-6 md:mb-8 w-full h-32 md:h-40 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative border border-border bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shadow-inner">
              <Brain size={60} className="text-primary/20 md:w-[80px] md:h-[80px]" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="px-4 md:px-5 py-2 md:py-2.5 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/20 text-[10px] md:text-xs font-black text-white uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-2xl">
                    Thử thách trí tuệ AI
                 </div>
              </div>
           </div>

           <div className="mb-8 md:mb-10">
             <h2 className={`text-2xl md:text-3xl font-display font-bold leading-[1.1] tracking-tight ${isBoss ? 'text-red-50' : 'text-text'}`}>
               {question.text}
             </h2>
           </div>
           
           <div className="grid grid-cols-1 gap-3 md:gap-4">
              {question.options.map((opt, i) => {
                const isSelected = selectedOption === i;
                const isCorrectOpt = i === question.correctAnswerIndex;
                const showResult = isSubmitted || isReview;
                
                let btnClass = "relative p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 text-left transition-all duration-300 group ";
                
                if (showResult) {
                  if (isCorrectOpt) btnClass += "border-success bg-success/5 text-success shadow-lg shadow-success/10";
                  else if (isSelected) btnClass += "border-danger bg-danger/5 text-danger shadow-lg shadow-danger/10";
                  else btnClass += "border-border opacity-40 grayscale";
                } else {
                  btnClass += isSelected 
                    ? "border-primary bg-primary/5 text-primary shadow-xl shadow-primary/10 scale-[1.01] md:scale-[1.02]" 
                    : "border-border hover:border-primary/40 hover:bg-primary/5";
                }

                return (
                  <motion.button
                    key={i}
                    whileHover={!showResult ? { x: 5 } : {}}
                    disabled={showResult}
                    onClick={() => {
                      sound.playClick();
                      setSelectedOption(i);
                    }}
                    className={btnClass}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center text-xs md:text-sm font-black border-2 transition-colors ${
                        isSelected ? 'bg-primary text-primary-text border-primary' : 'bg-surface border-border text-muted group-hover:border-primary/40'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-base md:text-lg font-medium">{opt}</span>
                    </div>
                    {showResult && isCorrectOpt && (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2">
                        <CheckCircle size={24} className="text-success" />
                      </div>
                    )}
                    {showResult && isSelected && !isCorrectOpt && (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2">
                        <XCircle size={24} className="text-danger" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
           </div>

           <AnimatePresence>
             {hint && !isSubmitted && !isReview && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="mt-8 p-6 bg-orange-500/5 border border-orange-500/20 rounded-3xl"
               >
                  <div className="flex items-center gap-2 text-orange-500 font-black text-xs uppercase tracking-widest mb-2">
                    <Zap size={16}/>
                    Gợi ý từ AI
                  </div>
                  <p className="text-sm italic text-orange-700 dark:text-orange-400 leading-relaxed">{hint}</p>
               </motion.div>
             )}

             {(isSubmitted || isReview || deepHelp) && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={`mt-10 p-8 rounded-[2rem] border ${
                   isCorrect ? 'bg-success/5 border-success/20' : 'bg-blue-500/5 border-blue-500/20'
                 }`}
               >
                  <div className={`flex items-center gap-2 mb-4 font-black text-xs uppercase tracking-widest ${
                    isCorrect ? 'text-success' : 'text-blue-500'
                  }`}>
                      <Sparkles size={18}/>
                      <span>{deepHelp ? 'AI Tư Duy Sâu Phân Tích' : 'Giải thích chi tiết'}</span>
                      <button
                        onClick={() => handleToggleSpeech(deepHelp || question.explanation)}
                        type="button"
                        className={`ml-auto p-1.5 px-3 rounded-xl border flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                          activeSpeechText === (deepHelp || question.explanation)
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md animate-pulse'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700/50 hover:bg-zinc-750'
                        }`}
                        title="Nghe gia sư AI đọc lời giải bằng tiếng Việt"
                      >
                        {activeSpeechText === (deepHelp || question.explanation) ? (
                          <>
                            <VolumeX size={12} />
                            Dừng đọc
                          </>
                        ) : (
                          <>
                            <Volume2 size={12} />
                            Nghe AI đọc
                          </>
                        )}
                      </button>
                  </div>
                  <div className="text-base leading-relaxed text-text whitespace-pre-wrap font-sans">
                      {deepHelp || question.explanation}
                   </div>

                   {!isCorrect && !thinkingAnalysis && (
                     <div className="mt-6 pt-6 border-t border-border flex flex-col xs:flex-row items-center justify-between gap-4">
                       <div className="text-left">
                         <h4 className="text-sm font-bold text-text flex items-center gap-1.5 leading-none">
                           <Brain size={14} className="text-purple-500" /> Chẩn Đoán Lỗi Sai Chuyên Sâu
                         </h4>
                         <p className="text-xs text-muted mt-1">Sử dụng mô hình lập luận đối chiếu lịch sử lỗi để tìm ra lỗ hổng của bạn.</p>
                       </div>
                       <button
                         onClick={handleAnalyzeThinking}
                         disabled={isAnalyzingThinking}
                         className="w-full xs:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white hover:bg-purple-700 active:scale-95 transition-all text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50"
                       >
                         {isAnalyzingThinking ? <Loader2 size={12} className="animate-spin"/> : <Brain size={12}/>}
                         CHẨN ĐOÁN TƯ DUY
                       </button>
                     </div>
                   )}
                </motion.div>
              )}

              {thinkingAnalysis && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-8 rounded-[2rem] border border-purple-500/20 bg-purple-500/5"
                >
                  <div className="flex items-center gap-2 mb-4 font-black text-xs uppercase tracking-widest text-purple-600 dark:text-purple-400">
                    <Brain size={18}/>
                    <span>Phân Tích Thói Quen Tư Duy Học Tập (Gemini Reasoning)</span>
                      <button
                        onClick={() => handleToggleSpeech(thinkingAnalysis)}
                        type="button"
                        className={`ml-auto p-1.5 px-3 rounded-xl border flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                          activeSpeechText === thinkingAnalysis
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md animate-pulse'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700/50 hover:bg-zinc-750'
                        }`}
                        title="Nghe gia sư AI đọc phân tích thói quen tư duy bằng tiếng Việt"
                      >
                        {activeSpeechText === thinkingAnalysis ? (
                          <>
                            <VolumeX size={12} />
                            Dừng đọc
                          </>
                        ) : (
                          <>
                            <Volume2 size={12} />
                            Nghe AI đọc
                          </>
                        )}
                      </button>
                  </div>
                  <div className="markdown-body text-sm md:text-base leading-relaxed text-text dark:text-zinc-100 font-sans">
                    <Markdown>{thinkingAnalysis}</Markdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>

        <div className="p-6 md:p-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-6 bg-background/50">
           <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
             <div className="flex flex-col">
               <span className="text-[9px] md:text-[10px] font-black text-muted uppercase tracking-widest">Phần thưởng</span>
               <div className="flex items-center gap-1 text-yellow-600 font-bold text-sm md:text-base">
                 <Coins size={14} className="md:w-[16px] md:h-[16px]" />
                 <span>+100 xu</span>
               </div>
             </div>
             <div className="w-px h-8 bg-border"></div>
             <div className="flex flex-col">
               <span className="text-[9px] md:text-[10px] font-black text-muted uppercase tracking-widest">Kinh nghiệm</span>
               <div className="flex items-center gap-1 text-primary font-bold text-sm md:text-base">
                 <Trophy size={14} className="md:w-[16px] md:h-[16px]" />
                 <span>+25 XP</span>
               </div>
             </div>
           </div>

           <div className="flex gap-3 w-full sm:w-auto">
              {!isSubmitted && !isReview ? (
                <button
                  onClick={() => {
                    setIsSubmitted(true);
                    if (selectedOption === question.correctAnswerIndex) {
                      sound.playCorrect();
                    } else {
                      sound.playIncorrect();
                    }
                  }}
                  disabled={selectedOption === null}
                  className="w-full sm:w-auto btn-primary px-8 md:px-12 py-3.5 md:py-4 rounded-2xl font-bold text-base md:text-lg shadow-xl shadow-primary/20 disabled:opacity-30 flex items-center justify-center gap-2 group"
                >
                  XÁC NHẬN
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    sound.playClick();
                    onAnswer(isCorrect, selectedOption);
                  }}
                  className={`w-full sm:w-auto px-8 md:px-12 py-3.5 md:py-4 rounded-2xl font-bold text-base md:text-lg text-white shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-105 ${
                    isCorrect ? 'bg-success shadow-success/20' : 'bg-danger shadow-danger/20'
                  }`}
                >
                  {isCorrect ? 'TIẾP TỤC' : 'THỬ LẠI'}
                  <ArrowRight size={20} />
                </button>
              )}
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuestionModal;
