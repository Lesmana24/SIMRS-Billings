import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { TarifsPage } from './pages/TarifsPage';
import { BillingsPage } from './pages/BillingsPage';
import { LedgersPage } from './pages/LedgersPage';
import { UsersPage } from './pages/UsersPage';
import { MyBillingsPage } from './pages/MyBillingsPage';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import './App.css';

const MainLayout = () => {
  const { isAuthenticated, isPasien, isStaff, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  useEffect(() => {
    if (isAuthenticated) {
      if (isPasien) {
        setActiveTab('my-billings');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [isAuthenticated, isPasien]);

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToRegister={() => setAuthView('register')} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return isStaff ? <Dashboard onNavigate={(tab) => setActiveTab(tab)} /> : <MyBillingsPage />;
      case 'analytics':
        return isStaff ? <AnalyticsDashboard /> : <MyBillingsPage />;
      case 'billings':
        return isStaff ? <BillingsPage /> : <MyBillingsPage />;
      case 'tarifs':
        return isStaff ? <TarifsPage /> : <MyBillingsPage />;
      case 'ledgers':
        return isStaff ? <LedgersPage /> : <MyBillingsPage />;
      case 'users':
        return isAdmin ? <UsersPage /> : <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'my-billings':
      default:
        return isPasien ? <MyBillingsPage /> : <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col font-sans text-gray-100 antialiased">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto min-w-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
