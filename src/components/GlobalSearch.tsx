import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, User, ArrowRight, X, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { supplierService } from '../services/supplierService';
import { Product, Supplier } from '../types';
import { useAuth } from '../context/AuthContext';

export default function GlobalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !isOpen) return;
    
    // In a real app, we might want debounced fetching instead of standard subscriptions
    // but for small inventory standard subscriptions are fast.
    const unsubProducts = productService.subscribeToProducts(user.uid, setProducts);
    const unsubSuppliers = supplierService.subscribeToSuppliers(user.uid, setSuppliers);
    
    return () => {
      unsubProducts();
      unsubSuppliers();
    };
  }, [user, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) || 
    p.sku.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.category?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      <div className="relative hidden md:block group">
        <button 
          onClick={() => setIsOpen(true)}
          className="w-64 pl-9 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg text-sm text-slate-400 text-left hover:bg-slate-200 hover:border-slate-300 transition-all outline-none flex items-center justify-between"
        >
          <span>Search inventory...</span>
          <div className="flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400">
            <Command size={10} /> K
          </div>
        </button>
        <Search size={14} className="absolute left-3 top-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                <Search size={22} className="text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search products, SKUs, or suppliers..."
                  className="flex-1 bg-transparent border-none outline-none text-lg text-slate-900 placeholder:text-slate-400"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {query.length > 0 ? (
                  <div className="space-y-4 p-2">
                    {/* Products Section */}
                    {filteredProducts.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inventory ({filteredProducts.length})</h4>
                        {filteredProducts.map(p => (
                          <button
                            key={p.id}
                            onClick={() => handleSelect('/inventory')}
                            className="w-full flex items-center gap-4 px-3 py-3 hover:bg-indigo-50 rounded-xl transition-all group"
                          >
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-500 transition-colors">
                              <Package size={20} />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-bold text-slate-800">{p.name}</p>
                              <p className="text-xs text-slate-500 font-mono italic">SKU: {p.sku} • Rs. {p.price}</p>
                            </div>
                            <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all mr-2" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Suppliers Section */}
                    {filteredSuppliers.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suppliers ({filteredSuppliers.length})</h4>
                        {filteredSuppliers.map(s => (
                          <button
                            key={s.id}
                            onClick={() => handleSelect('/suppliers')}
                            className="w-full flex items-center gap-4 px-3 py-3 hover:bg-emerald-50 rounded-xl transition-all group"
                          >
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-emerald-500 transition-colors">
                              <User size={20} />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-bold text-slate-800">{s.name}</p>
                              <p className="text-xs text-slate-500 font-medium italic">{s.category || 'Wholesale Partner'}</p>
                            </div>
                            <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all mr-2" />
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredProducts.length === 0 && filteredSuppliers.length === 0 && (
                      <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                        <Package size={48} className="opacity-10 mb-4" />
                        <p className="font-medium italic">No results found for "{query}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                      <Command size={32} className="opacity-20" />
                    </div>
                    <p className="text-sm font-medium">Type to search for products or suppliers...</p>
                    <p className="text-[10px] mt-2 font-bold uppercase tracking-widest opacity-50">Experimental Quick Search</p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-400">ESC</div>
                    <span className="text-[10px] text-slate-400">to close</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-400">↵</div>
                    <span className="text-[10px] text-slate-400">to select</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-bold tracking-tight uppercase">TechStock AI Core</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
