import React, { useState } from 'react';
import { Bot, X, Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { aiService } from '../services/aiService';
import { productService } from '../services/productService';
import { Product } from '../types';

interface AIImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function AIImportModal({ isOpen, onClose, userId }: AIImportModalProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<Partial<Product>[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleAnalyze = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setStatus(null);
    try {
      const extracted = await aiService.parseProductFromPrompt(prompt);
      setPreview(extracted);
      if (extracted.length === 0) {
        setStatus({ type: 'error', message: "AI couldn't find any products. Try writing more clearly (e.g., '10 units of Coke at 50 each')." });
      }
    } catch (err) {
      setStatus({ type: 'error', message: "Analysis failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (preview.length === 0 || isLoading) return;
    setIsLoading(true);
    try {
      for (const p of preview) {
        await productService.addProduct({
          name: p.name || 'Unknown Product',
          sku: p.sku || `AI-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          price: p.price || 0,
          stockQuantity: p.stockQuantity || 0,
          thresholdLevel: 5,
          description: 'Imported via AI Assistant'
        }, userId);
      }
      setStatus({ type: 'success', message: `Successfully added ${preview.length} products to inventory!` });
      setTimeout(() => {
        onClose();
        setPreview([]);
        setPrompt('');
        setStatus(null);
      }, 2000);
    } catch (err) {
      setStatus({ type: 'error', message: "Import failed. Some products might not have been added." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">AI Fast Import</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Natural Language Processing</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!preview.length ? (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <p className="text-sm text-indigo-700 leading-relaxed">
                      Write down your inventory list naturally. For example:<br/>
                      <span className="font-mono text-xs opacity-70">"I bought 10 NVMe SSDs (15000 each), 5 Motherboards (45000), and 12 RAM sticks at 8000."</span>
                    </p>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your products here..."
                    rows={6}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner"
                  />
                  <button 
                    onClick={handleAnalyze}
                    disabled={!prompt.trim() || isLoading}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} className="text-indigo-400" />}
                    Analyze & Extract
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-sm font-bold text-slate-900">Extracted Products ({preview.length})</h4>
                    <button onClick={() => setPreview([])} className="text-xs text-indigo-600 font-bold hover:underline">Start Over</button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {preview.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{p.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">SKU: {p.sku}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-700">Rs. {p.price}</div>
                          <div className="text-[10px] text-indigo-600 font-bold">{p.stockQuantity} Units</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {status && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${
                      status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      <span className="text-sm font-medium">{status.message}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setPreview([])}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleImport}
                      disabled={isLoading}
                      className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                    >
                      {isLoading ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle2 size={20} /> Add to Stock</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
