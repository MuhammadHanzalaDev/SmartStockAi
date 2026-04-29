import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { supplierService } from '../services/supplierService';
import { Product, Supplier } from '../types';
import { Search, Plus, Edit2, Trash2, Package, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BulkImportModal } from '../components/BulkImportModal';
import { AIImportModal } from '../components/AIImportModal';
import SmartRestock from '../components/SmartRestock';
import { Bot, Sparkles, LayoutGrid, ShoppingBag } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function InventoryPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [viewMode, setViewMode] = useState<'standard' | 'smart'>('standard');
  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isAIImportOpen, setAIImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Check for ?add=true param from dashboard
    const params = new URLSearchParams(location.search);
    if (params.get('add') === 'true') {
      setEditingProduct(null);
      setModalOpen(true);
      // Clean up URL without refreshing
      window.history.replaceState({}, '', '/inventory');
    }
  }, [location]);

  useEffect(() => {
    if (!user) return;
    const unsubProducts = productService.subscribeToProducts(user.uid, setProducts);
    const unsubSuppliers = supplierService.subscribeToSuppliers(user.uid, setSuppliers);
    return () => {
      unsubProducts();
      unsubSuppliers();
    };
  }, [user]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventory Management</h2>
          <p className="text-slate-500 text-sm">Control your stock levels and product catalog.</p>
        </div>
        
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
           <button 
             onClick={() => setViewMode('standard')}
             className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
               viewMode === 'standard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
             }`}
           >
             <LayoutGrid size={16} />
             Standard
           </button>
           <button 
             onClick={() => setViewMode('smart')}
             className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
               viewMode === 'smart' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
             }`}
           >
             <Sparkles size={16} />
             Smart View
           </button>
        </div>
      </header>

      {viewMode === 'smart' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
              <SmartRestock products={products} suppliers={suppliers} />
           </div>
           <div className="space-y-6">
              <div className="p-6 bg-slate-900 rounded-3xl text-white">
                 <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
                    <Package size={18} className="text-indigo-400" />
                    Why Smart View?
                 </h4>
                 <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Smart View uses AI to link your inventory needs directly to your supplier network. 
                    It prevents "Out of Stock" events before they happen.
                 </p>
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-indigo-300 font-bold uppercase">
                       <Sparkles size={12} className="text-indigo-400" /> Auto-matching
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-indigo-300 font-bold uppercase">
                       <Sparkles size={12} className="text-indigo-400" /> Priority Scoring
                    </div>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setAIImportOpen(true)}
            className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all shadow-sm group"
          >
            <Bot size={18} className="text-indigo-600 group-hover:scale-110 transition-transform" />
            AI Import
          </button>
          <button 
            onClick={() => setImportModalOpen(true)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Upload size={18} className="text-indigo-600" />
            Import
          </button>
          <button 
            onClick={() => { setEditingProduct(null); setModalOpen(true); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="overflow-auto max-h-[calc(100vh-320px)] custom-scrollbar">
          <table className="w-full text-left border-collapse sticky-header">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-right">Stock</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm italic-text">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{p.name}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500">{p.sku}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500">
                      {suppliers.find(s => s.id === p.supplierId)?.name || 'Generic'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">Rs. {p.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className={`font-bold ${p.stockQuantity <= p.thresholdLevel ? 'text-rose-600' : 'text-slate-700'}`}>
                      {p.stockQuantity}
                    </div>
                    <div className="text-[10px] text-slate-400">Min: {p.thresholdLevel}</div>
                  </td>
                  <td className="px-6 py-4 text-center text-[10px]">
                    <span className={`px-2 py-1 rounded-full font-bold uppercase tracking-tight ${
                      p.stockQuantity <= 0 
                        ? 'bg-rose-50 text-rose-700' 
                        : p.stockQuantity <= p.thresholdLevel 
                          ? 'bg-amber-50 text-amber-700' 
                          : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {p.stockQuantity <= 0 ? 'Out' : p.stockQuantity <= p.thresholdLevel ? 'Low' : 'OK'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setEditingProduct(p); setModalOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => productService.deleteProduct(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Package className="mx-auto mb-2 opacity-20" size={48} />
                    <p>No products found. Start by adding one!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        product={editingProduct}
        suppliers={suppliers}
      />

      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setImportModalOpen(false)}
        userId={user?.uid || ''}
      />

      <AIImportModal
        isOpen={isAIImportOpen}
        onClose={() => setAIImportOpen(false)}
        userId={user?.uid || ''}
      />
        </>
      )}
    </div>
  );
}

function ProductModal({ isOpen, onClose, product, suppliers }: { isOpen: boolean; onClose: () => void; product: Product | null; suppliers: Supplier[] }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '' as string | number,
    stockQuantity: '' as string | number,
    thresholdLevel: '' as string | number,
    supplierId: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        price: product.price,
        stockQuantity: product.stockQuantity,
        thresholdLevel: product.thresholdLevel,
        supplierId: product.supplierId || '',
        description: product.description || ''
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        price: '',
        stockQuantity: '',
        thresholdLevel: '',
        supplierId: '',
        description: ''
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const submissionData = {
        ...formData,
        price: Number(formData.price) || 0,
        stockQuantity: Number(formData.stockQuantity) || 0,
        thresholdLevel: Number(formData.thresholdLevel) || 0
      };

      if (product) {
        await productService.updateProduct(product.id, submissionData);
      } else {
        await productService.addProduct(submissionData, user.uid);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {product ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Product Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Intel Core i9-14900K"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">SKU Code</label>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, sku: `${formData.name.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`})}
                      className="text-[9px] font-bold text-indigo-600 hover:underline uppercase tracking-tighter"
                    >
                      Auto-Gen
                    </button>
                  </div>
                  <input 
                    required
                    type="text" 
                    value={formData.sku}
                    onChange={e => setFormData({...formData, sku: e.target.value})}
                    placeholder="CPU-001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price (Rs.)</label>
                  <input 
                    required
                    type="number" 
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Initial Stock</label>
                  <input 
                    required
                    type="number" 
                    value={formData.stockQuantity}
                    onChange={e => setFormData({...formData, stockQuantity: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Low Stock Limit</label>
                  <input 
                    required
                    type="number" 
                    value={formData.thresholdLevel}
                    onChange={e => setFormData({...formData, thresholdLevel: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Preferred Supplier</label>
                  <select 
                    value={formData.supplierId}
                    onChange={e => setFormData({...formData, supplierId: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Select a Supplier (Optional)</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Short Description (Optional)</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="e.g. 24-core, 32-thread flagship processor"
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center"
                >
                  {loading ? 'Processing...' : (product ? 'Update Details' : 'Add to Inventory')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
