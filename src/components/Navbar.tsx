import React, { useState } from 'react';
import {
  Bell,
  Building2,
  CheckCircle2,
  ChefHat,
  Cloud,
  CreditCard,
  KeyRound,
  LogOut,
  Monitor,
  ShieldCheck,
  Smartphone,
  Store,
  UserCheck,
  Utensils,
  Volume2
} from 'lucide-react';
import { Role } from '../types';
import { store, AppNotification } from '../services/store';
import { soundService } from '../utils/audio';

interface NavbarProps {
  onOpenLogin: (role?: Role) => void;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  activeRole: Role;
  onNavigateToRole: (role: Role, tenantId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLogin,
  isMobileFrame,
  setIsMobileFrame,
  activeRole,
  onNavigateToRole,
}) => {
  const currentUser = store.getCurrentUser();
  const tenants = store.getTenants();
  const activeTenantId = (currentUser && currentUser.role === 'tenant' && currentUser.tenantId)
    ? currentUser.tenantId
    : store.getActiveTenantId();
  const currentTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];
  const notifications = store.getNotifications();
  const orders = store.getOrders();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showCredentialsDrawer, setShowCredentialsDrawer] = useState(false);

  const unreadCount = notifications.length;
  const unpaidCount = orders.filter((o) => o.paymentStatus === 'unpaid').length;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-3 sm:px-4 py-2.5 text-stone-800 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          
          {/* ========================================================
              1. HEADER TAMPILAN KHUSUS PELANGGAN (USER)
             ======================================================== */}
          {activeRole === 'customer' && (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-sm shadow-xs">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm tracking-tight text-stone-900">
                      Food Court Nusantara
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                      Pemesanan Meja {store.getSelectedTable() || '04'}
                    </span>
                    <span
                      className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                      title="Terhubung ke Cloud Firestore Database (Realtime Sync)"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <Cloud className="w-2.5 h-2.5" />
                      <span>Database Aktif</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    Pesan mandiri tanpa antre &bull; Bayar di kasir sentral
                  </p>
                </div>
              </div>

              {/* Right Side: Tombol Login Staf & Bantuan Akun */}
              <div className="flex items-center gap-2">
                {/* Mobile/Desktop toggle */}
                <button
                  onClick={() => setIsMobileFrame(!isMobileFrame)}
                  className={`p-1.5 rounded-lg border text-xs font-medium transition-colors hidden sm:flex items-center gap-1 ${
                    isMobileFrame
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                  }`}
                  title={isMobileFrame ? 'Tampilan Layar Penuh' : 'Simulasi Smartphone'}
                >
                  {isMobileFrame ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{isMobileFrame ? 'Mobile' : 'Desktop'}</span>
                </button>

                {/* Info Akun Pengujian */}
                <button
                  onClick={() => setShowCredentialsDrawer(true)}
                  className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium border border-stone-200 flex items-center gap-1.5 transition-colors"
                  title="Daftar Akun Kredensial Pengujian"
                >
                  <KeyRound className="w-3.5 h-3.5 text-stone-500" />
                  <span className="hidden sm:inline">Daftar Akun</span>
                </button>

                {/* Login Staf (Kasir / Tenant / Admin) */}
                <button
                  onClick={() => onOpenLogin()}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Login Petugas</span>
                </button>
              </div>
            </>
          )}

          {/* ========================================================
              2. HEADER TAMPILAN KHUSUS KASIR
             ======================================================== */}
          {activeRole === 'kasir' && (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm tracking-tight text-stone-900">
                      POS Kasir Sentral
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      LOKET AKTIF
                    </span>
                    <span
                      className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                      title="Sinkronisasi Cloud Firestore Aktif"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <Cloud className="w-2.5 h-2.5" />
                      <span>Cloud Sync</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    Petugas: <span className="font-semibold text-stone-700">{currentUser?.name || 'Kasir 1'}</span>
                  </p>
                </div>
              </div>

              {/* Right Side: Indikator Antrean, Notif & Logout */}
              <div className="flex items-center gap-2">
                {/* Antrean Unpaid Badge */}
                {unpaidCount > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                    <span>{unpaidCount} Menunggu Bayar</span>
                  </span>
                )}

                {/* Tes Lonceng */}
                <button
                  onClick={() => soundService.playKitchenChime()}
                  className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl border border-stone-200 transition-colors"
                  title="Tes Bunyi Lonceng Dapur"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                {/* Notifikasi Popover Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="relative p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl border border-stone-200 transition-colors"
                    title="Notifikasi"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Popover */}
                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 px-1">
                        <span className="text-xs font-bold text-stone-800">Notifikasi Pesanan</span>
                        <span className="text-[10px] text-stone-400">{notifications.length} terbaru</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1.5 text-xs">
                        {notifications.length === 0 ? (
                          <p className="text-stone-400 text-center py-4 text-xs">Belum ada notifikasi baru.</p>
                        ) : (
                          notifications.slice(0, 6).map((notif) => (
                            <div
                              key={notif.id}
                              className="p-2 rounded-xl bg-stone-50 border border-stone-100 text-left"
                            >
                              <div className="flex justify-between items-center text-[10px] text-stone-500 mb-0.5">
                                <span className="font-bold text-stone-800">{notif.title}</span>
                                <span>{notif.timestamp}</span>
                              </div>
                              <p className="text-[11px] leading-tight text-stone-600">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile/Desktop Frame Toggle */}
                <button
                  onClick={() => setIsMobileFrame(!isMobileFrame)}
                  className={`p-1.5 rounded-xl border text-xs font-medium transition-colors hidden sm:flex items-center gap-1 ${
                    isMobileFrame
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                  }`}
                  title={isMobileFrame ? 'Tampilan Layar Penuh' : 'Simulasi Smartphone'}
                >
                  {isMobileFrame ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                </button>

                {/* Tombol Logout Kasir */}
                <button
                  onClick={() => store.logout()}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Keluar dari akun kasir"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            </>
          )}

          {/* ========================================================
              3. HEADER TAMPILAN KHUSUS TENANT (DAPUR & POS BOOTH)
             ======================================================== */}
          {activeRole === 'tenant' && (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-xl shadow-xs flex-shrink-0">
                  {currentTenant?.logo || '🏪'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm tracking-tight text-stone-900">
                      {currentTenant?.name || 'Tenant Food Court'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Booth {currentTenant?.boothNumber || 'A-01'}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    Kategori: {currentTenant?.category || 'Kuliner'} &bull; Staf: {currentUser?.name || 'Koki & Kasir Booth'}
                  </p>
                </div>
              </div>

              {/* Right Side: Tes Bunyi, Notif & Logout */}
              <div className="flex items-center gap-2">
                {/* Tes Bunyi */}
                <button
                  onClick={() => soundService.playKitchenChime()}
                  className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl border border-stone-200 transition-colors"
                  title="Tes Bunyi Notifikasi Dapur"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                {/* Notifikasi */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="relative p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl border border-stone-200 transition-colors"
                    title="Notifikasi Masuk"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 px-1">
                        <span className="text-xs font-bold text-stone-800">Pesanan Masuk Booth</span>
                        <span className="text-[10px] text-stone-400">{notifications.length} terbaru</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1.5 text-xs">
                        {notifications.length === 0 ? (
                          <p className="text-stone-400 text-center py-4 text-xs">Belum ada pesanan masuk.</p>
                        ) : (
                          notifications.slice(0, 6).map((notif) => (
                            <div
                              key={notif.id}
                              className="p-2 rounded-xl bg-stone-50 border border-stone-100 text-left"
                            >
                              <div className="flex justify-between items-center text-[10px] text-stone-500 mb-0.5">
                                <span className="font-bold text-stone-800">{notif.title}</span>
                                <span>{notif.timestamp}</span>
                              </div>
                              <p className="text-[11px] leading-tight text-stone-600">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Frame Toggle */}
                <button
                  onClick={() => setIsMobileFrame(!isMobileFrame)}
                  className={`p-1.5 rounded-xl border text-xs font-medium transition-colors hidden sm:flex items-center gap-1 ${
                    isMobileFrame
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                  }`}
                  title={isMobileFrame ? 'Tampilan Layar Penuh' : 'Simulasi Smartphone'}
                >
                  {isMobileFrame ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                </button>

                {/* Tombol Logout Tenant */}
                <button
                  onClick={() => store.logout()}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Keluar dari akun tenant"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            </>
          )}

          {/* ========================================================
              4. HEADER TAMPILAN KHUSUS ADMIN
             ======================================================== */}
          {activeRole === 'admin' && (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm tracking-tight text-stone-900">
                      Admin & Pengelola Food Court
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                      SUPER ADMIN
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    Pengelola: <span className="font-semibold text-stone-700">{currentUser?.name || 'Admin Pusat'}</span>
                  </p>
                </div>
              </div>

              {/* Right Side: Notif & Logout */}
              <div className="flex items-center gap-2">
                {/* Notifikasi */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="relative p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl border border-stone-200 transition-colors"
                    title="Notifikasi"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 px-1">
                        <span className="text-xs font-bold text-stone-800">Aktivitas Food Court</span>
                        <span className="text-[10px] text-stone-400">{notifications.length} terbaru</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1.5 text-xs">
                        {notifications.length === 0 ? (
                          <p className="text-stone-400 text-center py-4 text-xs">Belum ada aktivitas baru.</p>
                        ) : (
                          notifications.slice(0, 6).map((notif) => (
                            <div
                              key={notif.id}
                              className="p-2 rounded-xl bg-stone-50 border border-stone-100 text-left"
                            >
                              <div className="flex justify-between items-center text-[10px] text-stone-500 mb-0.5">
                                <span className="font-bold text-stone-800">{notif.title}</span>
                                <span>{notif.timestamp}</span>
                              </div>
                              <p className="text-[11px] leading-tight text-stone-600">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Frame Toggle */}
                <button
                  onClick={() => setIsMobileFrame(!isMobileFrame)}
                  className={`p-1.5 rounded-xl border text-xs font-medium transition-colors hidden sm:flex items-center gap-1 ${
                    isMobileFrame
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                  }`}
                  title={isMobileFrame ? 'Tampilan Layar Penuh' : 'Simulasi Smartphone'}
                >
                  {isMobileFrame ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                </button>

                {/* Tombol Logout Admin */}
                <button
                  onClick={() => store.logout()}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Keluar dari akun admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            </>
          )}

        </div>
      </header>

      {/* MODAL DAFTAR AKUN & KREDENSIAL DEMO */}
      {showCredentialsDrawer && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-4 shadow-2xl space-y-3 text-stone-800">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-stone-900">Daftar Akun Kredensial</h3>
              </div>
              <button
                onClick={() => setShowCredentialsDrawer(false)}
                className="text-stone-400 hover:text-stone-700 text-xs px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Gunakan kredensial berikut untuk login atau langsung buka halaman masing-masing peran:
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
              {/* Kasir */}
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-emerald-900 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Kasir Sentral
                  </div>
                  <div className="text-[11px] text-stone-500">
                    User: <code className="text-stone-800 bg-white border border-stone-200 px-1 py-0.5 rounded font-mono">kasir1</code> | Pass: <code className="text-stone-800 bg-white border border-stone-200 px-1 py-0.5 rounded font-mono">kasir123</code>
                  </div>
                </div>
                <button
                  onClick={() => {
                    store.switchRoleDirectly('kasir');
                    setShowCredentialsDrawer(false);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors shadow-xs"
                >
                  Buka Kasir
                </button>
              </div>

              {/* Tenants */}
              {tenants.map((tenant) => (
                <div key={tenant.id} className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-amber-900 flex items-center gap-1">
                      <ChefHat className="w-3.5 h-3.5 text-amber-600" /> {tenant.name}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      User: <code className="text-stone-800 bg-white border border-stone-200 px-1 py-0.5 rounded font-mono">{tenant.username}</code> | Pass: <code className="text-stone-800 bg-white border border-stone-200 px-1 py-0.5 rounded font-mono">{tenant.password}</code>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      store.switchRoleDirectly('tenant', tenant.id);
                      setShowCredentialsDrawer(false);
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-colors shadow-xs"
                  >
                    Buka Tenant
                  </button>
                </div>
              ))}

              {/* Admin */}
              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-indigo-900 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Admin Food Court
                  </div>
                  <div className="text-[11px] text-stone-500">
                    User: <code className="text-stone-800 bg-white border border-stone-200 px-1 py-0.5 rounded font-mono">admin</code> | Pass: <code className="text-stone-800 bg-white border border-stone-200 px-1 py-0.5 rounded font-mono">admin123</code>
                  </div>
                </div>
                <button
                  onClick={() => {
                    store.switchRoleDirectly('admin');
                    setShowCredentialsDrawer(false);
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-colors shadow-xs"
                >
                  Buka Admin
                </button>
              </div>

              {/* Customer */}
              <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sky-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-sky-600" /> Pelanggan (Self-Service)
                  </div>
                  <div className="text-[11px] text-sky-700">
                    Bebas Akses Tanpa Perlu Password
                  </div>
                </div>
                <button
                  onClick={() => {
                    store.switchRoleDirectly('customer');
                    setShowCredentialsDrawer(false);
                  }}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[11px] font-bold transition-colors shadow-xs"
                >
                  Buka User
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setShowCredentialsDrawer(false)}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
