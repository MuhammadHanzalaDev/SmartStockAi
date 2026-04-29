/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { History, Settings, Sparkles } from "lucide-react";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/Dashboard";
import InventoryPage from "./pages/Inventory";
import AdvisorPage from "./pages/Advisor";
import AnalyticsPage from "./pages/Analytics";
import SuppliersPage from "./pages/Suppliers";
import { AuthProvider } from "./context/AuthContext";
import { LoginPage, SignupPage } from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardLayout activePage="dashboard">
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/advisor" 
            element={
              <ProtectedRoute>
                <DashboardLayout activePage="advisor">
                  <AdvisorPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventory" 
            element={
              <ProtectedRoute>
                <DashboardLayout activePage="inventory">
                  <InventoryPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <DashboardLayout activePage="analytics">
                  <AnalyticsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/suppliers" 
            element={
              <ProtectedRoute>
                <DashboardLayout activePage="suppliers">
                  <SuppliersPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}


