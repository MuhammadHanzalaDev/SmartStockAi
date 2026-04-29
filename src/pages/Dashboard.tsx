import { Package, AlertTriangle, TrendingUp, ShoppingBag, Sparkles, Clock, ArrowUpRight, Loader2, Download, FileText, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { productService } from "../services/productService";
import { aiService, AIInsight } from "../services/aiService";
import { reportService } from "../services/reportService";
import { supplierService } from "../services/supplierService";
import { Product, Supplier } from "../types";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [smartStatus, setSmartStatus] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isReportMenuOpen, setReportMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubProducts = productService.subscribeToProducts(user.uid, setProducts);
    const unsubSuppliers = supplierService.subscribeToSuppliers(user.uid, setSuppliers);
    return () => {
      unsubProducts();
      unsubSuppliers();
    };
  }, [user]);

  useEffect(() => {
    if (products.length > 0 && !smartStatus && !aiLoading) {
      generateSmartStatus();
    }
  }, [products]);

  const generateSmartStatus = async () => {
     if (!products.length) return;
     try {
       const status = await aiService.getQuickStatus(products, profile?.languagePreference || 'english');
       setSmartStatus(status);
     } catch (e) {
       console.error("Status failed", e);
     }
  };

  const generateAIInsights = async () => {
    if (products.length === 0) return;
    setAiLoading(true);
    try {
      const data = await aiService.analyzeInventory(
        products, 
        suppliers,
        profile?.shopName || "Our Shop",
        profile?.languagePreference || 'english'
      );
      setInsights(data);
    } catch (err) {
      console.error("Failed to generate AI insights:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    reportService.exportToPDF(products, profile?.shopName || 'TechStock Assistant');
    setReportMenuOpen(false);
  };

  const handleDownloadCSV = () => {
    reportService.exportToCSV(products, profile?.shopName || 'TechStock Assistant');
    setReportMenuOpen(false);
  };

  // Auto-generate on first meaningful data load or language change
  useEffect(() => {
    if (products.length > 0 && !aiLoading) {
      setInsights(null); // Clear to show loading state on language change
      generateAIInsights();
    }
  }, [products.length, profile?.languagePreference]);

  const lowStockItems = products.filter(p => p.stockQuantity <= p.thresholdLevel);
  const totalValue = products.reduce((acc, p) => acc + (p.price * p.stockQuantity), 0);

  const stats = [
    { label: "Total Products", value: products.length.toString(), change: "Live", icon: Package, color: "text-slate-900" },
    { label: "Low Stock Items", value: lowStockItems.length.toString(), change: lowStockItems.length > 0 ? "Attention" : "Healthy", icon: AlertTriangle, color: lowStockItems.length > 0 ? "text-rose-600" : "text-emerald-600" },
    { label: "Inventory Value", value: `Rs. ${totalValue.toLocaleString()}`, change: "Estimate", icon: TrendingUp, color: "text-slate-900" },
    { label: "AI Efficiency", value: "92%", change: "Optimal", icon: Sparkles, color: "text-indigo-600" },
    { label: "Suppliers", value: suppliers.length.toString(), change: "Partners", icon: ShoppingBag, color: "text-slate-900" },
  ];

  const activities = [
    { text: "System monitoring active", time: "Just now", color: "bg-emerald-500" },
    { text: "Inventory baseline established", time: "Today", color: "bg-indigo-500" },
  ];

  return (
    <div className="flex-1 flex flex-col gap-8 min-h-0">
      {/* Quick Stats Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{profile?.languagePreference === 'roman_urdu' ? 'Assalam-o-Alaikum!' : 'Hello!'} 👋</h2>
          <p className="text-slate-500 text-sm mt-1">Here is your {profile?.shopName || "shop's"} inventory report for today.</p>
        </div>
        
        {smartStatus && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 max-w-md mx-6 px-4 py-2 bg-indigo-600 rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-100 hidden md:flex group cursor-help transition-all hover:scale-105"
          >
            <div className="p-1.5 bg-white/20 rounded-lg text-white">
              <Sparkles size={16} />
            </div>
            <p className="text-xs font-bold text-white leading-snug">
              {smartStatus}
            </p>
          </motion.div>
        )}

        <div className="relative">
          <button 
            onClick={() => setReportMenuOpen(!isReportMenuOpen)}
            className="hidden sm:flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Download size={18} />
            Export Report
          </button>
          
          <AnimatePresence>
            {isReportMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setReportMenuOpen(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden"
                >
                  <button 
                    onClick={handleDownloadPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100 font-medium"
                  >
                    <FileText size={18} className="text-rose-500" />
                    Download PDF
                  </button>
                  <button 
                    onClick={handleDownloadCSV}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                  >
                    <FileSpreadsheet size={18} className="text-emerald-500" />
                    Download CSV
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 shrink-0">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                stat.change === 'Attention' ? 'text-rose-600 bg-rose-50 font-bold' : 'text-slate-400 bg-slate-50'
              }`}>
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Section: Table & AI Alerts */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Table Section */}
        <div className="flex-[2] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Critical Stock Items</h3>
            <Link to="/inventory" className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1 group">
              Manage All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-3 border-b border-slate-100">Product Name</th>
                  <th className="px-6 py-3 border-b border-slate-100 text-right">Current Stock</th>
                  <th className="px-6 py-3 border-b border-slate-100 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600 divide-y divide-slate-100">
                {lowStockItems.slice(0, 5).map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors text-right">
                    <td className="px-6 py-4 font-medium text-slate-900 text-left">{item.name}</td>
                    <td className="px-6 py-4 font-mono text-right">{item.stockQuantity} Units</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-[10px] rounded-full font-bold inline-block min-w-[70px] ${
                        item.stockQuantity <= 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {item.stockQuantity <= 0 ? "OUT" : "LOW"}
                      </span>
                    </td>
                  </tr>
                ))}
                {lowStockItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                      {products.length === 0 ? "Add your first product to see stock alerts." : (profile?.languagePreference === 'roman_urdu' ? "Shabash! Sab kuch stock mein hai." : "Great job! Everything is in stock.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Info Section */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Business Advisor Teaser */}
          <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group shrink-0">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-400" />
                  Business Advisor
                </h4>
                <Link 
                  to="/advisor" 
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                  title="Open full Advisor chat"
                >
                  <ArrowUpRight size={14} className="text-slate-400" />
                </Link>
              </div>
              
              <div className="space-y-4 flex-1">
                {insights ? (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-indigo-600/10 rounded-xl border border-indigo-500/20 backdrop-blur-sm">
                      <p className="text-[11px] text-indigo-100 leading-relaxed italic line-clamp-3">
                        "{insights.summary.endsWith('.') ? insights.summary.split('.')[0] : insights.summary}."
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Stock Risks</span>
                        <span className="text-[11px] font-bold text-rose-400">{insights.lowStockAlerts.length} Critical</span>
                      </div>
                      <div className="flex flex-col gap-1 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Restock</span>
                        <span className="text-[11px] font-bold text-indigo-400">{insights.restockRecommendations.length} Items</span>
                      </div>
                    </div>

                    {insights.actionableInsights && insights.actionableInsights.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Actionable Recs</span>
                        {insights.actionableInsights.slice(0, 2).map((action, i) => (
                          <div key={i} className="flex gap-2 items-start text-[10px] text-slate-300">
                             <div className="w-1 h-1 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                             {action}
                          </div>
                        ))}
                      </div>
                    )}

                    <Link 
                      to="/advisor"
                      className="block w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold text-center transition-all shadow-md mt-2"
                    >
                      Ask Advisor a Question
                    </Link>
                  </div>
                ) : (
                  <div className="py-10 flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-xl gap-3">
                    {aiLoading ? (
                      <>
                        <Loader2 size={24} className="animate-spin text-indigo-400" />
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">AI Analyzing...</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic px-4 text-center">
                        {products.length > 0 ? "Analyzing your shop..." : "Add products for AI advice."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col shrink-0 min-h-0">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Daily Signals</h4>
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 max-h-[200px]">
              {activities.map((activity, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full ${activity.color} mt-1.5 shrink-0`}></div>
                  <div>
                    <p className="text-xs text-slate-800 leading-tight font-medium">{activity.text}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



