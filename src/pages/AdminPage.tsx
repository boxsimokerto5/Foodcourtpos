import React, { useState } from 'react';
import {
  Building2,
  DollarSign,
  Plus,
  QrCode,
  Store,
  TrendingUp,
  Users,
  Utensils,
  KeyRound,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  ChevronRight,
  Sparkles,
  Percent,
  BarChart3
} from 'lucide-react';
import { store, formatIDR } from '../services/store';
import { soundService } from '../utils/audio';
import { AdminAnalyticsCharts } from '../components/AdminAnalyticsCharts';

export const AdminPage: React.FC = () => {
  const tenants = store.getTenants();
  const orders = store.getOrders();
  const tables = store.getTables();
  const menu = store.getMenu();

  const [activeTab, setActiveTab] = useState<'analitik' | 'ringkasan' | 'tenant' | 'meja' | 'transaksi'>('analitik');

  // Form New Tenant User
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantCategory, setNewTenantCategory] = useState('');
  const [newTenantBooth, setNewTenantBooth] = useState('');
  const [newTenantPhone, setNewTenantPhone] = useState('');
  const [newTenantCommission, setNewTenantCommission] = useState(15);
  const [newTenantUsername, setNewTenantUsername] = useState('');
  const [newTenantPassword, setNewTenantPassword] = useState('');
  const [copiedTable, setCopiedTable] = useState<string | null>(null);

  // Statistics calculation
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const totalOmzet = paidOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalCommission = paidOrders.reduce((acc, o) => {
    // 15% average commission
    return acc + o.totalAmount * 0.15;
  }, 0);
  const pendingOrders = orders.filter((o) => o.paymentStatus === 'unpaid');

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantUsername || !newTenantPassword) return;

    store.addTenant(
      newTenantName,
      newTenantCategory || 'Kuliner Makanan & Minuman',
      newTenantBooth || `Booth ${tenants.length + 1}`,
      newTenantPhone || '0812-0000-0000',
      newTenantCommission,
      newTenantUsername,
      newTenantPassword
    );

    soundService.playCashierSuccess();
    setShowAddTenantModal(false);
    // Reset form
    setNewTenantName('');
    setNewTenantCategory('');
    setNewTenantBooth('');
    setNewTenantPhone('');
    setNewTenantUsername('');
    setNewTenantPassword('');
  };

  const copyTableLink = (tableNum: string) => {
    const url = `${window.location.origin}${window.location.pathname}?table=${tableNum}`;
    navigator.clipboard?.writeText(url);
    setCopiedTable(tableNum);
    soundService.playClick();
    setTimeout(() => setCopiedTable(null), 2000);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-indigo-50/50 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200">
              <Building2 className="w-4 h-4" />
            </span>
            <h1 className="text-base font-extrabold text-stone-900 tracking-tight">
              Dashboard Admin & Pengelola Food Court
            </h1>
          </div>
          <p className="text-xs text-stone-600">
            Pusat kendali operasional, monitoring omzet seluruh booth, dan manajemen akun user tenant.
          </p>
        </div>

        <button
          onClick={() => setShowAddTenantModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah User Tenant Baru</span>
        </button>
      </div>

      {/* Metric Cards - Rapat & Elegan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1 font-medium">
            <span>Total Omzet Food Court</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-700 tracking-tight">{formatIDR(totalOmzet)}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">{paidOrders.length} transaksi sukses</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1 font-medium">
            <span>Bagi Hasil / Komisi</span>
            <Percent className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-black text-amber-700 tracking-tight">{formatIDR(totalCommission)}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Pendapatan pengelola</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1 font-medium">
            <span>Booth Tenant Aktif</span>
            <Store className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-black text-stone-900 tracking-tight">
            {tenants.filter((t) => t.isOpen).length} / {tenants.length}
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">Booth terdaftar di sistem</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1 font-medium">
            <span>Menunggu di Kasir</span>
            <Clock className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-black text-rose-600 tracking-tight">{pendingOrders.length}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Pesanan belum dibayar</div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-stone-200 pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('analitik')}
          className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === 'analitik' ? 'bg-indigo-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Grafik & Analitik Food Court</span>
        </button>
        <button
          onClick={() => setActiveTab('ringkasan')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'ringkasan' ? 'bg-indigo-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Performa Tenant
        </button>
        <button
          onClick={() => setActiveTab('tenant')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'tenant' ? 'bg-indigo-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Kelola User Tenant ({tenants.length})
        </button>
        <button
          onClick={() => setActiveTab('meja')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'meja' ? 'bg-indigo-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          QR Meja & Self-Service
        </button>
        <button
          onClick={() => setActiveTab('transaksi')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'transaksi' ? 'bg-indigo-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Riwayat Transaksi ({orders.length})
        </button>
      </div>

      {/* TAB 0: Grafik & Visualisasi Analitik Recharts */}
      {activeTab === 'analitik' && (
        <AdminAnalyticsCharts orders={orders} tenants={tenants} menu={menu} />
      )}

      {/* TAB 1: Performa Tenant */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tenants.map((tenant) => {
              // Calculate revenue for this tenant
              let tenantSales = 0;
              let orderCount = 0;
              paidOrders.forEach((ord) => {
                const ts = ord.tenantStatuses[tenant.id];
                if (ts) {
                  tenantSales += ts.subtotal;
                  orderCount += 1;
                }
              });
              const commissionCut = tenantSales * (tenant.commissionRate / 100);
              const netForTenant = tenantSales - commissionCut;

              return (
                <div
                  key={tenant.id}
                  className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-xl shadow-xs">
                        {tenant.logo}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-stone-900">{tenant.name}</h3>
                        <p className="text-[11px] text-stone-500">
                          {tenant.boothNumber} • Komisi {tenant.commissionRate}%
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        tenant.isOpen
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border-stone-200'
                      }`}
                    >
                      {tenant.isOpen ? 'Buka' : 'Tutup'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <div>
                      <span className="text-[10px] text-stone-500 block">Omzet Kotor</span>
                      <span className="font-bold text-stone-900">{formatIDR(tenantSales)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">Bagi Hasil ({tenant.commissionRate}%)</span>
                      <span className="font-bold text-amber-700">{formatIDR(commissionCut)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">Netto Tenant</span>
                      <span className="font-bold text-emerald-700">{formatIDR(netForTenant)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500">
                    <span>{orderCount} Porsi Pesanan Terjual</span>
                    <button
                      onClick={() => store.switchRoleDirectly('tenant', tenant.id)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      <span>Buka Layar Tenant</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Kelola User Tenant */}
      {activeTab === 'tenant' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-800">Daftar Akun User & Hak Akses Tenant</h3>
            <button
              onClick={() => setShowAddTenantModal(true)}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah User Tenant
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tenants.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{t.logo}</span>
                    <span className="font-bold text-stone-900">{t.name}</span>
                  </div>
                  <button
                    onClick={() => store.toggleTenantStatus(t.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      t.isOpen
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {t.isOpen ? 'Status: Aktif' : 'Status: Nonaktif'}
                  </button>
                </div>

                <div className="p-2 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-stone-500">Username Login:</span>
                    <code className="text-stone-900 bg-white border border-stone-200 px-1.5 py-0.5 rounded font-mono font-bold shadow-2xs">
                      {t.username}
                    </code>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-stone-500">Password:</span>
                    <code className="text-stone-900 bg-white border border-stone-200 px-1.5 py-0.5 rounded font-mono font-bold shadow-2xs">
                      {t.password}
                    </code>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-stone-500">Kontak WhatsApp:</span>
                    <span className="text-stone-800 font-medium">{t.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-stone-500 font-medium">{t.boothNumber}</span>
                  <button
                    onClick={() => store.switchRoleDirectly('tenant', t.id)}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-lg text-[11px] font-medium transition-colors"
                  >
                    Masuk Sebagai Booth Ini
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: QR Meja & Self Service */}
      {activeTab === 'meja' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-white border border-stone-200 text-xs text-stone-700 flex items-center justify-between shadow-xs">
            <div>
              <span className="font-bold text-stone-900 block">Link Akses Pelanggan Mandiri (Tanpa Password)</span>
              <span className="text-stone-500 text-[11px]">
                Pelanggan cukup scan QR di atas meja atau klik link untuk langsung memesan tanpa perlu login.
              </span>
            </div>
            <button
              onClick={() => store.switchRoleDirectly('customer')}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Buka Layar Tamu
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {tables.map((tbl) => (
              <div
                key={tbl.number}
                className="p-3 rounded-2xl bg-white border border-stone-200 shadow-xs text-center space-y-2 text-xs"
              >
                <div className="w-8 h-8 mx-auto rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center font-black text-sky-700 text-sm">
                  {tbl.number}
                </div>
                <div className="font-bold text-stone-900">Meja {tbl.number}</div>

                <div className="w-24 h-24 mx-auto bg-stone-50 p-1 rounded-xl border border-stone-200 shadow-inner flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=foodcourt-meja-${tbl.number}`}
                    alt={`QR Meja ${tbl.number}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex gap-1 pt-1">
                  <button
                    onClick={() => copyTableLink(tbl.number)}
                    className="flex-1 py-1 px-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedTable === tbl.number ? 'Disalin!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={() => {
                      store.setSelectedTable(tbl.number);
                      store.switchRoleDirectly('customer');
                    }}
                    className="py-1 px-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-[10px] font-semibold"
                    title="Buka pesanan meja ini"
                  >
                    Pesan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Riwayat Transaksi */}
      {activeTab === 'transaksi' && (
        <div className="space-y-2">
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3 border-b border-stone-100 font-bold text-xs text-stone-800 flex justify-between items-center">
              <span>Semua Log Pesanan Food Court</span>
              <span className="text-[11px] text-stone-500 font-normal">{orders.length} total pesanan</span>
            </div>

            <div className="divide-y divide-stone-100 max-h-[500px] overflow-y-auto text-xs">
              {orders.map((ord) => (
                <div key={ord.id} className="p-3 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">#{ord.orderNumber} ({ord.id})</span>
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] border border-stone-200">
                        Meja {ord.tableNumber}
                      </span>
                      <span className="text-stone-500 text-[11px]">• {ord.customerName}</span>
                    </div>
                    <div className="text-[11px] text-stone-600 mt-1">
                      {ord.items.map((i) => `${i.quantity}x ${i.name} (${i.tenantName})`).join(', ')}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      Dibuat: {new Date(ord.createdAt).toLocaleTimeString('id-ID')} via {ord.createdBy}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0">
                    <span className="font-extrabold text-stone-900 text-sm">{formatIDR(ord.totalAmount)}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ord.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {ord.paymentStatus === 'paid' ? 'Lunas / Terbayar' : 'Belum Bayar'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah User Tenant Baru */}
      {showAddTenantModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-4 shadow-xl text-stone-800">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-stone-900">Buat Akun User Tenant Baru</h3>
              </div>
              <button
                onClick={() => setShowAddTenantModal(false)}
                className="text-stone-400 hover:text-stone-800 p-1 rounded-md bg-stone-100 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 text-[11px] mb-1 font-semibold">Nama Tenant / Usaha</label>
                <input
                  type="text"
                  required
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="Contoh: Bebek Goreng H. Slamet"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-600 text-[11px] mb-1 font-semibold">Nomor Booth</label>
                  <input
                    type="text"
                    required
                    value={newTenantBooth}
                    onChange={(e) => setNewTenantBooth(e.target.value)}
                    placeholder="Contoh: Booth C-01"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 text-[11px] mb-1 font-semibold">Komisi Pengelola (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newTenantCommission}
                    onChange={(e) => setNewTenantCommission(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 text-[11px] mb-1 font-semibold">Kategori Makanan</label>
                <input
                  type="text"
                  value={newTenantCategory}
                  onChange={(e) => setNewTenantCategory(e.target.value)}
                  placeholder="Contoh: Masakan Bebek & Sambal"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2">
                <div className="font-semibold text-indigo-900 text-[11px] flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Kredensial Login Tenant</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-600 text-[10px] mb-1 font-medium">Username</label>
                    <input
                      type="text"
                      required
                      value={newTenantUsername}
                      onChange={(e) => setNewTenantUsername(e.target.value)}
                      placeholder="bebek"
                      className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-900 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 text-[10px] mb-1 font-medium">Password</label>
                    <input
                      type="text"
                      required
                      value={newTenantPassword}
                      onChange={(e) => setNewTenantPassword(e.target.value)}
                      placeholder="bebek123"
                      className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-900 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTenantModal(false)}
                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Simpan & Buat User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
