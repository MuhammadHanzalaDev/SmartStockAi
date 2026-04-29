import { ReactNode, useState } from "react";
import { LayoutDashboard, Package, History, Settings, LogOut, Menu, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate, NavLink } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";
import GlobalSearch from "../components/GlobalSearch";
import AIVoiceCommand from "../components/AIVoiceCommand";

interface LayoutProps {
  children: ReactNode;
  activePage: string;
}

export default function DashboardLayout({ children, activePage }: LayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024) { // lg breakpoint
      setSidebarOpen(false);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard, path: "/" },
    { id: "advisor", label: "AI Business Advisor", icon: Sparkles, path: "/advisor" },
    { id: "inventory", label: "Inventory", icon: Package, path: "/inventory" },
    { id: "analytics", label: "Analytics", icon: History, path: "/analytics" },
    { id: "suppliers", label: "Suppliers", icon: Settings, path: "/suppliers" },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] flex flex-col shrink-0 lg:relative"
          >
            <div className="flex flex-col h-full">
              <div className="p-6">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-lg tracking-tight">SmartStock AI</span>
                  <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-slate-400">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <nav className="flex-1 px-4 space-y-1 mt-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) => 
                      `flex items-center w-full gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                        isActive
                          ? "bg-indigo-600/20 text-indigo-400 border-l-4 border-indigo-500"
                          : "text-slate-400 hover:bg-slate-800"
                      }`
                    }
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="p-4 mt-auto border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 uppercase">
                    {profile?.shopName?.substring(0, 2) || (user?.email?.substring(0, 2).toUpperCase() || 'U')}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-semibold text-white truncate">{profile?.shopName || 'Shop'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            {!isSidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-1 mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
              >
                <Menu size={20} />
              </button>
            )}
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium capitalize">{activePage.replace("-", " ")}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <GlobalSearch />
            <button 
              onClick={() => navigate('/inventory?add=true')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Package size={16} />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>
        </header>

        <main className="p-8 flex-1 flex flex-col gap-8 min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>
      <AIVoiceCommand />
    </div>
  );
}


