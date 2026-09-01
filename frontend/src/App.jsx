import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import Toast from './components/Toast';
import CaseEntryPage from './pages/CaseEntryPage';
import ReportPage from './pages/ReportPage';
import SystemStatusModal from './components/forensic/SystemStatusModal';
import GlobalSearchModal from './components/forensic/GlobalSearchModal';
import ForensicBackground from './components/forensic/ForensicBackground';
import { authApi, casesApi } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('entry'); // 'entry', 'report', 'reconstruction'
  const [activeCase, setActiveCase] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [backendOnline, setBackendOnline] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount or auto-login with default Investigator credentials
    const currentUser = authApi.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      authApi.login('investigator@crimeanalytics.gov', 'Invest@123')
        .then((userData) => {
          setUser(userData);
          setBackendOnline(true);
        })
        .catch((err) => {
          console.warn('Auto-login notice:', err);
        });
    }
  }, []);

  // Global keyboard shortcut: Ctrl+K / Cmd+K for Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = ({ type, message }) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    showToast({ type: 'success', message: `Authenticated as ${userData.firstName || 'Investigator'} (${userData.role || 'INVESTIGATOR'})` });
  };

  const handleSwitchRole = async (email, password) => {
    try {
      const data = await authApi.login(email, password);
      setUser(data);
      showToast({ type: 'success', message: `Switched operational role to ${data.role} (${data.firstName} ${data.lastName})` });
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to switch role' });
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    showToast({ type: 'info', message: 'Logged out of investigation suite.' });
  };

  const handleCaseCreated = (newCase) => {
    setActiveCase(newCase);
    setActivePage('report');
  };

  const handleNavigationChange = (page) => {
    setActivePage(page);
    if (page === 'reconstruction') {
      setTimeout(() => {
        const el = document.getElementById('reconstruction');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleToggleChat = () => {
    if (activePage === 'entry') {
      setActivePage('report');
    }
    setIsChatOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-200 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 font-sans relative overflow-x-hidden">
      
      {/* Animated 3D Cyber Grid & Ambient Background */}
      <ForensicBackground />

      {/* Top Navigation Bar */}
      <Navbar
        activePage={activePage}
        setActivePage={handleNavigationChange}
        activeCase={activeCase}
        onOpenLogin={() => setIsLoginOpen(true)}
        user={user}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenStatus={() => setIsStatusOpen(true)}
        onToggleChat={handleToggleChat}
        isChatOpen={isChatOpen}
      />

      {/* Main Content Pages with smooth enter animation */}
      <main className="flex-1 relative z-10">
        {activePage === 'entry' ? (
          <CaseEntryPage
            onCaseCreated={handleCaseCreated}
            showToast={showToast}
          />
        ) : (
          <ReportPage
            caseData={activeCase}
            onSelectCase={setActiveCase}
            showToast={showToast}
            initialTab={activePage}
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
            isChatOpen={isChatOpen}
            setIsChatOpen={setIsChatOpen}
          />
        )}
      </main>

      {/* Professional Command Center Footer */}
      <footer className="py-5 border-t border-slate-800/80 bg-[#060910]/90 backdrop-blur-md text-xs text-slate-500 font-mono relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 AI Crime Analytics Suite. Enterprise Forensic RAG & Scene Simulation Platform.</p>
          <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
            <span>Spring Boot 3.2 Backend</span>
            <span>•</span>
            <span>React + Vite 5.2</span>
            <span>•</span>
            <span className="text-cyan-400">Port 5173 ↔ 8080</span>
          </div>
        </div>
      </footer>

      {/* System Status Modal */}
      <SystemStatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        backendOnline={backendOnline}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
