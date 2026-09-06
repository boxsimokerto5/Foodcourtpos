import React, { useState, useEffect } from 'react';
import { Role } from './types';
import { store } from './services/store';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { AdminPage } from './pages/AdminPage';
import { KasirPage } from './pages/KasirPage';
import { TenantPage } from './pages/TenantPage';
import { CustomerSelfServicePage } from './pages/CustomerSelfServicePage';
import { soundService } from './utils/audio';

export default function App() {
  const [, setTick] = useState(0);

  // Subscribe to central reactive store
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => unsubscribe();
  }, []);

  const activeRole = store.getActiveRole();
  const currentUser = store.getCurrentUser();

  // Mobile frame simulator toggle
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginTargetRole, setLoginTargetRole] = useState<Role | undefined>(undefined);

  // Check URL params on initial load (e.g. ?role=tenant&tenant=tenant-1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role') as Role;
      const tenantParam = params.get('tenant');
      if (roleParam && ['admin', 'kasir', 'tenant', 'customer'].includes(roleParam)) {
        store.switchRoleDirectly(roleParam, tenantParam || undefined);
      }
    }
  }, []);

  const handleNavigateToRole = (role: Role, tenantId?: string) => {
    soundService.playClick();

    // If role is customer, no credentials required
    if (role === 'customer') {
      store.switchRoleDirectly('customer');
      return;
    }

    // If already logged in as this role, switch directly
    if (currentUser && currentUser.role === role) {
      store.switchRoleDirectly(role, tenantId);
      return;
    }

    // Prompt login credentials modal
    setLoginTargetRole(role);
    setIsLoginModalOpen(true);
  };

  const handleOpenLogin = (role?: Role) => {
    setLoginTargetRole(role);
    setIsLoginModalOpen(true);
  };

  // Render strictly the active role's page
  const renderActivePage = () => {
    switch (activeRole) {
      case 'admin':
        return <AdminPage />;
      case 'kasir':
        return <KasirPage />;
      case 'tenant':
        return <TenantPage />;
      case 'customer':
      default:
        return <CustomerSelfServicePage />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col font-sans">
      {/* Top Navigation Bar - Menyesuaikan secara eksklusif dengan Peran yang Aktif */}
      <Navbar
        onOpenLogin={handleOpenLogin}
        isMobileFrame={isMobileFrame}
        setIsMobileFrame={setIsMobileFrame}
        activeRole={activeRole}
        onNavigateToRole={handleNavigateToRole}
      />

      {/* Main Content Area - HANYA menampilkan halaman dari role yang bersangkutan */}
      <main className="flex-1 p-2 sm:p-4 flex flex-col items-center justify-start">
        {isMobileFrame ? (
          /* Smartphone Frame Mockup for "Mobile App" Feel */
          <div className="w-full max-w-[420px] bg-stone-200 border-4 border-stone-300 rounded-[44px] shadow-2xl overflow-hidden flex flex-col my-2 ring-1 ring-stone-200 relative min-h-[760px] max-h-[850px]">
            {/* Top Phone Speaker / Notch */}
            <div className="h-6 bg-stone-200 flex items-center justify-center relative flex-shrink-0">
              <div className="w-20 h-4 bg-stone-100 rounded-b-xl flex items-center justify-center">
                <div className="w-10 h-1 bg-stone-300 rounded-full" />
              </div>
              <div className="absolute left-6 top-1 text-[10px] text-stone-600 font-mono">12:00</div>
              <div className="absolute right-6 top-1 text-[10px] text-emerald-600 font-mono">100% ⚡</div>
            </div>

            {/* Inner Phone Screen */}
            <div className="flex-1 overflow-y-auto p-3 bg-stone-50 text-stone-800">
              {renderActivePage()}
            </div>

            {/* Mobile Frame Bottom Home Indicator */}
            <div className="h-4 bg-stone-200 flex items-center justify-center flex-shrink-0">
              <div className="w-32 h-1 bg-stone-400 rounded-full" />
            </div>
          </div>
        ) : (
          /* Responsive Fluid Layout (Desktop, Tablet, Mobile) */
          <div className="w-full max-w-6xl mx-auto pb-8">
            {renderActivePage()}
          </div>
        )}
      </main>

      {/* Login Credentials Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        targetRole={loginTargetRole}
      />
    </div>
  );
}
