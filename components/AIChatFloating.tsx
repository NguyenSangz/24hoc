
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles, User, Minimize2, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIChatFloating: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Xin chào! Tôi là Trợ lý AI của 24hoc. Bạn có câu hỏi gì về bài học hay bất kỳ chủ đề nào không? Tôi luôn sẵn sàng hỗ trợ bạn!' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
      return;
    }

    if (activeSpeechText === textToSpeak) {
      window.speechSynthesis.cancel();
      setActiveSpeechText(null);
      return;
    }

    window.speechSynthesis.cancel();

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "Bạn là một trợ lý giáo dục thông minh, thân thiện và nhiệt huyết của nền tảng 24hoc. Bạn có kiến thức sâu rộng về mọi lĩnh vực từ Toán, Lý, Hóa đến Văn học, Lịch sử và đời sống. Hãy trả lời câu hỏi của người dùng một cách chi tiết, dễ hiểu và truyền cảm hứng học tập. Sử dụng Markdown để định dạng câu trả lời đẹp mắt.",
        },
      });

      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      const result = await chat.sendMessageStream({ message: userMessage });
      let fullText = '';
      
      for await (const chunk of result) {
        const chunkText = chunk.text;
        fullText += chunkText;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', text: fullText };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Rất tiếc, đã có lỗi xảy ra khi kết nối với trí tuệ nhân tạo. Vui lòng thử lại sau nhé!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '64px' : '500px',
              width: isMinimized ? '200px' : '380px'
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col mb-4 max-w-[calc(100vw-3rem)]"
          >
            {/* Header */}
            <div className="p-4 bg-primary text-primary-text flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-none">Gia sư AI 24hoc</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-[10px] opacity-80 font-medium">Đang trực tuyến</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-zinc-50/50 dark:bg-zinc-950/50">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600' : 'bg-primary/10 text-primary'}`}>
                          {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                        </div>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed relative group/msg ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-text rounded-tr-none shadow-sm' 
                            : 'bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-tl-none shadow-sm text-zinc-800 dark:text-zinc-200'
                        }`}>
                          <div className="markdown-body prose prose-sm dark:prose-invert max-w-none pb-2">
                            <Markdown>{msg.text}</Markdown>
                          </div>
                          {msg.role === 'model' && msg.text && (
                            <button
                              onClick={() => handleToggleSpeech(msg.text)}
                              type="button"
                              className={`absolute right-2 bottom-1 p-1 rounded-lg border transition-all text-[9px] font-bold flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 cursor-pointer ${
                                activeSpeechText === msg.text
                                  ? 'bg-orange-500 border-orange-500 text-white opacity-100 animate-pulse'
                                  : 'bg-zinc-100 dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
                              }`}
                              title="Nghe trợ lý AI đọc lời thoại"
                            >
                              {activeSpeechText === msg.text ? <VolumeX size={10} /> : <Volume2 size={10} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-2 items-center text-muted text-xs font-medium bg-white dark:bg-zinc-800 px-4 py-2 rounded-full border border-zinc-100 dark:border-zinc-700 shadow-sm">
                        <Loader2 size={12} className="animate-spin text-primary" />
                        AI đang suy nghĩ...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Hỏi bất cứ điều gì..."
                      className="w-full pl-4 pr-12 py-3 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary text-primary-text rounded-xl disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-muted mt-2">
                    AI có thể đưa ra thông tin chưa chính xác. Hãy kiểm tra lại nhé!
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 ${
          isOpen ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rotate-90 opacity-0 pointer-events-none' : 'bg-primary text-primary-text'
        }`}
      >
        <MessageSquare size={24} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
      </motion.button>
    </div>
  );
};

export default AIChatFloating;
