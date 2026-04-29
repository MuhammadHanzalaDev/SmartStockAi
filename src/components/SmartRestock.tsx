import React, { useState } from 'react';
import { ShoppingCart, Sparkles, Loader2, Package, Users, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { aiService } from '../services/aiService';
import { Product, Supplier } from '../types';

interface SmartRestockProps {
  products: Product[];
  suppliers: Supplier[];
}

export default function SmartRestock({ products, suppliers }: SmartRestockProps) {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const result = await aiService.generateRestockPlan(products, suppliers);
      setPlan(result);
    } catch (error) {
      console.error("Restock failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-6 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">AI Smart Restock</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">Auto-match low stock with your registered suppliers.</p>
        </div>
        <button 
          onClick={generatePlan}
          disabled={loading || products.length === 0}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
          {plan ? 'Regenerate Plan' : 'Generate Order'}
        </button>
      </div>

      <div className="p-6">
        {!plan && !loading && (
          <div className="py-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
              <Package size={32} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 italic">No plan generated yet</h4>
            <p className="text-[10px] text-slate-400 max-w-[200px] mt-2 leading-relaxed">
              Click generate to analyze stock levels and match them with vendors.
            </p>
          </div>
        )}

        {loading && (
          <div className="py-16 text-center">
            <Loader2 size={40} className="animate-spin text-indigo-200 mx-auto mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">AI Analyzing Supply Chain...</p>
          </div>
        )}

        {plan && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="p-4 bg-indigo-600 rounded-2xl text-white">
              <p className="text-[11px] font-medium leading-relaxed opacity-90 italic">
                "{plan.summary}"
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Suggested Purchase List</h4>
              {plan.plan.map((item: any, i: number) => (
                <div key={i} className="space-y-0">
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-t-2xl hover:border-indigo-200 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item.urgency === 'high' ? 'bg-rose-100 text-rose-600' : 
                        item.urgency === 'medium' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {item.urgency === 'high' ? <AlertCircle size={20} /> : <Package size={20} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{item.productName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Users size={10} className="text-slate-400" />
                          <span className="text-[10px] text-slate-500 font-medium">{item.supplierName}</span>
                        </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">+{item.suggestedQuantity} units</div>
                      <div className="text-[10px] text-indigo-600 font-bold">Est. Cost: Rs. {item.simulatedCost?.toLocaleString()}</div>
                      <span className={`text-[9px] font-bold uppercase tracking-tighter ${
                        item.urgency === 'high' ? 'text-rose-500' : 'text-slate-400'
                      }`}>{item.urgency} priority</span>
                   </div>
                </div>
                <div className="px-4 pb-4 bg-slate-50 border-x border-b border-slate-100 rounded-b-2xl -mt-2 pt-4">
                   <p className="text-[10px] text-slate-500 italic flex items-center gap-1.5">
                      <Sparkles size={10} className="text-indigo-400" />
                      {item.reasoning}
                   </p>
                </div>
              </div>
              ))}
              
              {plan.plan.length === 0 && (
                <div className="py-8 text-center bg-emerald-50 rounded-2xl border border-dashed border-emerald-200">
                   <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                   <p className="text-xs font-bold text-emerald-800">Everything looks great!</p>
                   <p className="text-[10px] text-emerald-600 mt-1">AI suggests no immediate restocks needed.</p>
                </div>
              )}

              {plan.plan.length > 0 && (
                <div className="p-4 bg-slate-100 rounded-2xl flex items-center justify-between border border-slate-200">
                   <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Est. Investment</span>
                   <span className="text-lg font-black text-indigo-600">
                     Rs. {plan.plan.reduce((acc: number, curr: any) => acc + (curr.simulatedCost || 0), 0).toLocaleString()}
                   </span>
                </div>
              )}
            </div>

            {plan.plan.length > 0 && (
              <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all group">
                 Share with Suppliers via WhatsApp
                 <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
