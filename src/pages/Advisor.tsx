import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, TrendingUp, AlertTriangle, Package2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { aiService } from '../services/aiService';
import { Product } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  { text: "What should I restock today?", icon: Package2 },
  { text: "Which product gives highest profit?", icon: TrendingUp },
  { text: "How is my shop performing?", icon: Sparkles },
  { text: "Identify low stock risks.", icon: AlertTriangle },
];

export default function AdvisorPage() {
  const { user, profile } = useAuth();
  const isRomanUrdu = profile?.languagePreference === 'roman_urdu';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: isRomanUrdu 
        ? `Assalam-o-Alaikum ${profile?.shopName || 'Manager'}! Main aapka SmartStock AI Business Advisor hoon. Aap mujhse apni inventory aur shop performance ke baare mein sawal pooch sakte hain. Main aapko data ki madad se behtareen mashware doonga.`
        : `Hello ${profile?.shopName || 'Manager'}! I am your SmartStock AI Business Advisor. You can ask me questions about your inventory and shop performance. I will provide you with data-driven advice.`,
      timestamp: new Date()
    }
  ]);

  // Update welcome message if language changed
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{
          ...prev[0],
          content: isRomanUrdu 
            ? `Assalam-o-Alaikum ${profile?.shopName || 'Manager'}! Main aapka SmartStock AI Business Advisor hoon. Aap mujhse apni inventory aur shop performance ke baare mein sawal pooch sakte hain. Main aapko data ki madad se behtareen mashware doonga.`
            : `Hello ${profile?.shopName || 'Manager'}! I am your SmartStock AI Business Advisor. You can ask me questions about your inventory and shop performance. I will provide you with data-driven advice.`
        }];
      }
      return prev;
    });
  }, [isRomanUrdu, profile?.shopName]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const unsubscribe = productService.subscribeToProducts(user.uid, setProducts);
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.askAdvisor(
        text, 
        products, 
        profile?.shopName || 'My Shop',
        profile?.languagePreference || 'english'
      );
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Advisor Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Business Advisor</h2>
            <p className="text-xs text-slate-500 font-medium">Powered by AI Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100 flex items-center gap-1.5 uppercase tracking-wider">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Active Insight
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-600'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none ring-1 ring-slate-200/50'
              }`}>
                {msg.content}
                <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-slate-400" />
                <span className="text-sm text-slate-400 italic">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input / Suggestions */}
      <div className="p-6 border-t border-slate-100 space-y-4 bg-slate-50/30">
        <AnimatePresence>
          {messages.length === 1 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 overflow-hidden"
            >
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s.text)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2"
                >
                  <s.icon size={14} className="text-indigo-400" />
                  {s.text}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRomanUrdu ? "Poochiye, aaj tech inventory ke liye kya restock karna chahiye?" : "Ask anything about your technical inventory performance..."}
            disabled={isLoading}
            className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Send size={18} className="group-active:scale-95 transition-transform" />
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-widest">
          AI generated advice based on your current inventory.
        </p>
      </div>
    </div>
  );
}
