import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { AuditLogPage } from './pages/AuditLogPage';
import { ClaimsPage } from './pages/ClaimsPage';
import { ProfilePage } from './pages/ProfilePage';
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
      case 'claims':
        return isStaff ? <ClaimsPage /> : <MyBillingsPage />;
      case 'tarifs':
        return isStaff ? <TarifsPage /> : <MyBillingsPage />;
      case 'ledgers':
        return isStaff ? <LedgersPage /> : <MyBillingsPage />;
      case 'audit-logs':
        return isStaff ? <AuditLogPage /> : <MyBillingsPage />;
      case 'users':
        return isAdmin ? <UsersPage /> : <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'profile':
        return <ProfilePage />;
      case 'my-billings':
      default:
        return isPasien ? <MyBillingsPage /> : <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col font-sans antialiased overflow-hidden transition-colors duration-200">
      <Navbar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        onOpenProfile={() => setActiveTab('profile')}
      />
      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 h-full overflow-y-auto p-4 md:p-6 min-w-0 [scrollbar-gutter:stable]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
