import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Sparkles, X, Wand2, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { aiService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { supplierService } from '../services/supplierService';
import { useNavigate } from 'react-router-dom';
import { Product, Supplier } from '../types';

export default function AIVoiceCommand() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (user && isOpen) {
      const unsubProducts = productService.subscribeToProducts(user.uid, setProducts);
      const unsubSuppliers = supplierService.subscribeToSuppliers(user.uid, setSuppliers);
      return () => {
        unsubProducts();
        unsubSuppliers();
      };
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US'; // Can be tuned for Urdu-English mixed

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const resultTranscript = event.results[current][0].transcript;
        setTranscript(resultTranscript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setResponse("Microphone access was denied. Please enable mic permissions in your browser settings and try again.");
        } else {
          setResponse(`Error: ${event.error}. Please try again.`);
        }
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setResponse('');
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleProcess = async () => {
    if (!transcript || isProcessing || !user) return;
    setIsProcessing(true);
    try {
      const result = await aiService.processCommand(
        transcript, 
        { products, suppliers },
        profile?.languagePreference || 'english'
      );
      setResponse(result.response);
      
      // Execute Action
      if (result.action === 'NAVIGATE') {
        navigate(result.data.page === 'dashboard' ? '/' : `/${result.data.page}`);
      } else if (result.action === 'ADD_STOCK') {
        const found = products.find(p => 
          p.name.toLowerCase().includes(result.data.name?.toLowerCase()) || 
          result.data.name?.toLowerCase().includes(p.name.toLowerCase())
        );
        const supplier = result.data.supplierName 
          ? suppliers.find(s => 
              s.name.toLowerCase().includes(result.data.supplierName.toLowerCase()) ||
              result.data.supplierName.toLowerCase().includes(s.name.toLowerCase())
            ) 
          : null;
        
        if (found) {
          await productService.updateProduct(found.id, { 
            stockQuantity: found.stockQuantity + (result.data.quantity || 0),
            supplierId: supplier ? supplier.id : found.supplierId
          });
          
          if (result.data.isUrgent) {
            // Note: We don't have an 'urgent' field on product right now, 
            // but we could set the threshold high or just keep the AI response.
            // For now, the AI response already confirms the urgency.
          }
        } else {
          // Create new product if not found
          await productService.addProduct({
            name: result.data.name,
            sku: `${result.data.name.substring(0,3).toUpperCase()}-${Math.floor(1000+Math.random()*9000)}`,
            price: result.data.price || 0,
            stockQuantity: result.data.quantity || 0,
            thresholdLevel: 5,
            supplierId: supplier ? supplier.id : ''
          }, user.uid);
        }
      } else if (result.action === 'UPDATE_PRICE') {
        const found = products.find(p => p.name.toLowerCase().includes(result.data.name?.toLowerCase()));
        if (found) {
          await productService.updateProduct(found.id, { 
            price: result.data.price || found.price 
          });
        }
      }
      
      // Auto-hide after success
      setTimeout(() => {
        if (result.action !== 'UNKNOWN') {
           // Maybe keep open to show response
        }
      }, 3000);

    } catch (error) {
      setResponse("Sorry, I had trouble processing that.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isListening && transcript && !isProcessing) {
      handleProcess();
    }
  }, [isListening, transcript]);

  return (
    <>
      <button 
        onClick={() => {
          setIsOpen(true);
          setTranscript('');
          setResponse('');
        }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 to-white/20 group-hover:from-purple-500/20 transition-all"></div>
        <Wand2 size={24} className="relative z-10" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full animate-pulse"></div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden mb-safe"
            >
              <div className="p-6 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">SmartStock AI Voice</h3>
                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Connected & Ready</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 flex flex-col items-center text-center space-y-8">
                <div className="relative">
                  <AnimatePresence mode="wait">
                    {isListening && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="absolute inset-0 bg-indigo-100 rounded-full animate-ping"
                      />
                    )}
                  </AnimatePresence>
                  <button 
                    onClick={toggleListening}
                    disabled={isProcessing}
                    className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                      isListening ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-indigo-600 text-white shadow-indigo-200'
                    } shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50`}
                  >
                    {isProcessing ? <Loader2 size={40} className="animate-spin" /> : (isListening ? <MicOff size={40} /> : <Mic size={40} />)}
                  </button>
                </div>

                <div className="min-h-[80px] w-full">
                  {!transcript && !response && !isProcessing && (
                    <div className="space-y-4">
                      <p className="text-slate-400 italic">"Say a command to manage your shop"</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button onClick={() => { setTranscript('Add 2 processors'); handleProcess(); }} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-medium text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all cursor-pointer">
                          "Add 2 processors"
                        </button>
                        <button onClick={() => { setTranscript('Go to inventory'); handleProcess(); }} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-medium text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all cursor-pointer">
                          "Go to inventory"
                        </button>
                        <button onClick={() => { setTranscript('Update price of processors to 5000'); handleProcess(); }} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-medium text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all cursor-pointer">
                          "Update price"
                        </button>
                      </div>
                    </div>
                  )}
                  {transcript && !response && (
                    <p className="text-xl font-bold text-slate-900 animate-pulse">"{transcript}..."</p>
                  )}
                  {response && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                         Action Performed
                      </div>
                      <p className="text-xl font-bold text-slate-900 leading-tight">
                        {response}
                      </p>
                      <button 
                        onClick={() => { setTranscript(''); setResponse(''); }}
                        className="text-xs text-indigo-600 font-bold hover:underline"
                      >
                        Try another command
                      </button>
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                   <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                      <Volume2 size={16} className="text-indigo-400 mb-2" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Voice Stock</p>
                      <p className="text-xs text-slate-600 mt-1">Update stock quantities without typing</p>
                   </div>
                   <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                      <Wand2 size={16} className="text-purple-400 mb-2" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Smart Navi</p>
                      <p className="text-xs text-slate-600 mt-1">Jump between pages with simple commands</p>
                   </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-white/40 text-[9px] font-bold text-center uppercase tracking-tighter">
                Powered by Gemini AI • Real-time Speech Analysis
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
