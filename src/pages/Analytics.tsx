import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, AlertTriangle, ArrowUpRight, BarChart3, PieChart as PieIcon, Calendar, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { Product } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { motion } from 'motion/react';

export default function AnalyticsPage() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (user) {
      const unsubscribe = productService.subscribeToProducts(user.uid, setProducts);
      return () => unsubscribe();
    }
  }, [user]);

  // Derived Data
  const totalValue = products.reduce((acc, p) => acc + (p.price * p.stockQuantity), 0);
  const lowStockCount = products.filter(p => p.stockQuantity <= p.thresholdLevel).length;
  
  const categoryData = products.reduce((acc: any[], p) => {
    const category = p.sku.substring(0, 3).toUpperCase() || 'GEN';
    const existing = acc.find(item => item.name === category);
    if (existing) {
      existing.value += p.price * p.stockQuantity;
      existing.count += 1;
    } else {
      acc.push({ name: category, value: p.price * p.stockQuantity, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 5);

  const topProducts = [...products]
    .sort((a, b) => (b.price * b.stockQuantity) - (a.price * a.stockQuantity))
    .slice(0, 6)
    .map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      value: p.price * p.stockQuantity,
      stock: p.stockQuantity
    }));

  const stockDistribution = [
    { name: 'Healthy', value: products.filter(p => p.stockQuantity > p.thresholdLevel * 2).length, color: '#10B981' },
    { name: 'Warning', value: products.filter(p => p.stockQuantity <= p.thresholdLevel * 2 && p.stockQuantity > p.thresholdLevel).length, color: '#F59E0B' },
    { name: 'Critical', value: products.filter(p => p.stockQuantity <= p.thresholdLevel).length, color: '#EF4444' },
  ];

  const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F97316'];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Advanced Analytics</h2>
          <p className="text-slate-500 text-sm mt-1">Deep dive into your shop's inventory performance and valuation.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          {['7d', '30d', '90d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === range ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Value Distribution Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-500" />
                Valuation by Category (PKR)
              </h3>
              <p className="text-xs text-slate-400 mt-1">Total inventory value categorized by SKU patterns.</p>
            </div>
            <span className="text-sm font-bold text-slate-900">Rs. {totalValue.toLocaleString()}</span>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(value) => `Rs.${value/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Stock Status Pie */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col"
        >
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
            <PieIcon size={18} className="text-emerald-500" />
            Stock Health
          </h3>
          
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stockDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 mt-4">
            {stockDistribution.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-500">{item.name}</span>
                </div>
                <span className="text-slate-900">{item.value} Items</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Products List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 bg-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-indigo-300 flex items-center gap-2">
              <TrendingUp size={18} />
              Highest Value Products
            </h3>
          </div>
          
          <div className="space-y-4 flex-1">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{p.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{p.stock} units in stock</span>
                </div>
                <span className="text-xs font-bold text-emerald-400">Rs. {p.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-indigo-600 rounded-2xl flex items-center gap-3">
             <div className="p-2 bg-indigo-500 rounded-lg">
                <Info size={16} />
             </div>
             <p className="text-[10px] font-medium leading-relaxed">
               Focus on top 3 products for peak profitability. Ensure restock before critical levels.
             </p>
          </div>
        </motion.div>

        {/* Detailed Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Inventory Turnover Est.</h4>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-slate-900">4.2x</div>
              <div className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg flex items-center gap-1">
                +12% <TrendingUp size={10} />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">Your inventory completes a full cycle approx. every 86 days.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Critical Reorder Gap</h4>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-rose-600">{lowStockCount}</div>
              <div className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg flex items-center gap-1">
                Risk detected
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">{lowStockCount} items need immediate supplier coordination.</p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
