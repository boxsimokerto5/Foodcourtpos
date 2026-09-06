import React, { useState } from 'react';
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  Edit3,
  Flame,
  Image as ImageIcon,
  Minus,
  Plus,
  Send,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Utensils,
  UtensilsCrossed,
  Volume2
} from 'lucide-react';
import { MenuItem, Order, OrderItem, Tenant } from '../types';
import { store, formatIDR } from '../services/store';
import { soundService } from '../utils/audio';

const PRESET_FOOD_IMAGES = [
  { label: 'Soto / Sup', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Nasi Goreng', url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80' },
  { label: 'Mie / Bakmi', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80' },
  { label: 'Bakso', url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80' },
  { label: 'Ayam Goreng', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80' },
  { label: 'Sate Daging', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80' },
  { label: 'Es Teh / Jeruk', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80' },
  { label: 'Jus Segar', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80' },
  { label: 'Kopi Susu', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Camilan Snack', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80' },
];

export const TenantPage: React.FC = () => {
  const tenants = store.getTenants();
  const currentUser = store.getCurrentUser();
  const activeTenantId = (currentUser && currentUser.role === 'tenant' && currentUser.tenantId)
    ? currentUser.tenantId
    : store.getActiveTenantId();
  const currentTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];
  const allOrders = store.getOrders();
  const menuItems = store.getMenuByTenant(currentTenant?.id || '');
  const tables = store.getTables();

  const [activeTab, setActiveTab] = useState<'kds' | 'pos' | 'menu'>('kds');

  // Direct Order POS State (Staf tenant input pesanan langsung)
  const [posTable, setPosTable] = useState('01');
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posCart, setPosCart] = useState<OrderItem[]>([]);
  const [posSuccessMsg, setPosSuccessMsg] = useState('');

  // Add Menu Modal State
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuCategory, setNewMenuCategory] = useState<'makanan' | 'minuman' | 'snack'>('makanan');
  const [newMenuPrice, setNewMenuPrice] = useState(25000);
  const [newMenuDesc, setNewMenuDesc] = useState('');
  const [newMenuImage, setNewMenuImage] = useState(PRESET_FOOD_IMAGES[0].url);
  const [newMenuSpicy, setNewMenuSpicy] = useState(true);
  const [menuSuccessMsg, setMenuSuccessMsg] = useState('');

  // Add Menu submission handler
  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName.trim()) return;

    store.addMenuItem({
      tenantId: currentTenant.id,
      tenantName: currentTenant.name,
      name: newMenuName.trim(),
      description: newMenuDesc.trim() || 'Disajikan segar dan higienis dengan resep istimewa pilihan.',
      price: Number(newMenuPrice) || 20000,
      image: newMenuImage || PRESET_FOOD_IMAGES[0].url,
      category: newMenuCategory,
      isAvailable: true,
      spicyLevelAvailable: newMenuSpicy,
    });

    soundService.playSuccess();
    setMenuSuccessMsg(`Menu "${newMenuName}" berhasil ditambahkan ke booth ${currentTenant.name}!`);
    setShowAddMenuModal(false);
    setNewMenuName('');
    setNewMenuDesc('');
    setNewMenuPrice(25000);
    setTimeout(() => setMenuSuccessMsg(''), 4000);
  };

  const handleDeleteMenuItem = (item: MenuItem) => {
    if (window.confirm(`Hapus menu "${item.name}" dari daftar booth?`)) {
      store.deleteMenuItem(item.id);
      soundService.playClick();
      setMenuSuccessMsg(`Menu "${item.name}" berhasil dihapus.`);
      setTimeout(() => setMenuSuccessMsg(''), 3000);
    }
  };

  // Filter orders that contain items from this tenant and are PAID
  const tenantPaidOrders = allOrders.filter(
    (ord) => ord.paymentStatus === 'paid' && ord.tenantStatuses[currentTenant.id]
  );

  // Split by tenant cooking status
  const needCookingOrders = tenantPaidOrders.filter(
    (ord) => ord.tenantStatuses[currentTenant.id]?.status === 'cooking'
  );
  const readyOrders = tenantPaidOrders.filter(
    (ord) => ord.tenantStatuses[currentTenant.id]?.status === 'ready'
  );
  const completedOrders = tenantPaidOrders.filter(
    (ord) => ord.tenantStatuses[currentTenant.id]?.status === 'completed'
  );

  // POS Add to Cart
  const handlePosAddToCart = (item: MenuItem) => {
    soundService.playClick();
    const existing = posCart.find((ci) => ci.menuItemId === item.id);
    if (existing) {
      setPosCart(
        posCart.map((ci) =>
          ci.menuItemId === item.id
            ? { ...ci, quantity: ci.quantity + 1, subtotal: (ci.quantity + 1) * ci.price }
            : ci
        )
      );
    } else {
      setPosCart([
        ...posCart,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          tenantId: currentTenant.id,
          tenantName: currentTenant.name,
          subtotal: item.price,
        },
      ]);
    }
  };

  const handlePosRemoveFromCart = (menuItemId: string) => {
    soundService.playClick();
    const existing = posCart.find((ci) => ci.menuItemId === menuItemId);
    if (!existing) return;
    if (existing.quantity > 1) {
      setPosCart(
        posCart.map((ci) =>
          ci.menuItemId === menuItemId
            ? { ...ci, quantity: ci.quantity - 1, subtotal: (ci.quantity - 1) * ci.price }
            : ci
        )
      );
    } else {
      setPosCart(posCart.filter((ci) => ci.menuItemId !== menuItemId));
    }
  };

  const posTotalAmount = posCart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmitPosOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0) return;

    store.createOrder(
      posTable,
      posCustomerName || `Pelanggan Booth ${currentTenant.name}`,
      posCart,
      'tenant'
    );

    soundService.playCashierSuccess();
    setPosSuccessMsg(`Pesanan berhasil dikirim ke Kasir Sentral untuk pembayaran!`);
    setPosCart([]);
    setPosCustomerName('');
    setTimeout(() => setPosSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-3 max-w-6xl mx-auto">
      {/* Header Banner - Bersih & Menarik */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-2xl shadow-xs">
            {currentTenant.logo}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-stone-900 tracking-tight">{currentTenant.name}</h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                {currentTenant.boothNumber}
              </span>
            </div>
            <p className="text-xs text-stone-600">
              Kitchen Display & POS Booth • {currentTenant.category}
            </p>
          </div>
        </div>

        {/* Tenant Switcher Pill */}
        <div className="flex items-center gap-1 bg-stone-100/80 p-1 rounded-xl border border-stone-200 text-xs">
          <span className="text-stone-500 text-[10px] px-2 font-medium">Pilih Booth:</span>
          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => store.switchRoleDirectly('tenant', t.id)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                t.id === currentTenant.id
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <span>{t.logo}</span>
              <span className="hidden sm:inline">{t.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2 text-xs">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('kds')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'kds'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Kitchen Display Dapur</span>
            {needCookingOrders.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {needCookingOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'pos'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Input Pesanan Booth (POS)</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Kelola Menu & Stok</span>
          </button>
        </div>

        <button
          onClick={() => soundService.playKitchenChime()}
          className="p-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs flex items-center gap-1 shadow-xs"
          title="Tes Lonceng Dapur"
        >
          <Volume2 className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline text-[11px] font-medium">Tes Lonceng</span>
        </button>
      </div>

      {/* TAB 1: KITCHEN DISPLAY SYSTEM (KDS) */}
      {activeTab === 'kds' && (
        <div className="space-y-3">
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center gap-2 text-stone-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>
                Monitoring Aktif: Pesanan yang telah dibayar di kasir akan berbunyi dan muncul di kolom{' '}
                <strong className="text-amber-800">Perlu Dimasak</strong>.
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-mono font-medium">
              {needCookingOrders.length + readyOrders.length} Pesanan Berjalan
            </span>
          </div>

          {/* 3-Column Kitchen Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Column 1: Perlu Dimasak (Paid & Need Cooking) */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 flex items-center justify-between shadow-xs">
                <span className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>Perlu Dimasak ({needCookingOrders.length})</span>
                </span>
                <span className="text-[10px] text-amber-800 font-bold bg-amber-200/80 px-2 py-0.5 rounded-full">
                  Sudah Dibayar
                </span>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {needCookingOrders.length === 0 ? (
                  <div className="p-6 text-center bg-white border border-stone-200 rounded-xl text-stone-500 text-xs shadow-xs">
                    Semua pesanan selesai dimasak! Menunggu pesanan lunas berikutnya.
                  </div>
                ) : (
                  needCookingOrders.map((ord) => {
                    const myItems = ord.tenantStatuses[currentTenant.id]?.items || [];
                    return (
                      <div
                        key={ord.id}
                        className="p-3 rounded-2xl bg-white border-2 border-amber-400 shadow-sm text-xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between border-b border-stone-100 pb-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-amber-700 text-sm">#{ord.orderNumber}</span>
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 font-bold text-stone-800 text-[11px] border border-stone-200">
                                Meja {ord.tableNumber}
                              </span>
                            </div>
                            <span className="text-[11px] text-stone-500 mt-0.5 block font-medium">{ord.customerName}</span>
                          </div>
                          <span className="text-[10px] text-stone-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(ord.paymentTime || ord.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Items for this tenant */}
                        <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                          {myItems.map((item, idx) => (
                            <div key={idx} className="space-y-0.5">
                              <div className="flex justify-between font-bold text-stone-800 text-[12px]">
                                <span>
                                  <span className="text-amber-700 mr-1.5">{item.quantity}x</span>
                                  {item.name}
                                </span>
                              </div>
                              {item.spicyLevel !== undefined && (
                                <span className="inline-block px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 text-[10px] font-semibold border border-rose-200">
                                  Level Pedas: {item.spicyLevel}
                                </span>
                              )}
                              {item.selectedOptions && item.selectedOptions.length > 0 && (
                                <div className="text-[10px] text-stone-500">
                                  + {item.selectedOptions.map((o) => o.name).join(', ')}
                                </div>
                              )}
                              {item.notes && (
                                <div className="text-[10px] italic text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  Note: {item.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Action Bump Button */}
                        <button
                          onClick={() => store.updateTenantOrderStatus(ord.id, currentTenant.id, 'ready')}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Siap Diambil di Booth!</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 2: Siap Diambil (Ready for Customer Pickup) */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between shadow-xs">
                <span className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span>Siap Diambil ({readyOrders.length})</span>
                </span>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  Tunggu Tamu
                </span>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {readyOrders.length === 0 ? (
                  <div className="p-6 text-center bg-white border border-stone-200 rounded-xl text-stone-500 text-xs shadow-xs">
                    Tidak ada pesanan yang sedang menunggu pengambilan.
                  </div>
                ) : (
                  readyOrders.map((ord) => {
                    const myItems = ord.tenantStatuses[currentTenant.id]?.items || [];
                    return (
                      <div
                        key={ord.id}
                        className="p-3 rounded-2xl bg-white border border-emerald-300 shadow-xs text-xs space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-black text-emerald-700 text-sm">#{ord.orderNumber}</span>
                            <span className="ml-2 px-2 py-0.5 rounded bg-stone-100 font-bold text-stone-800 text-[11px] border border-stone-200">
                              Meja {ord.tableNumber}
                            </span>
                            <div className="text-[11px] text-stone-500 mt-0.5">{ord.customerName}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            Siap Ambil
                          </span>
                        </div>

                        <div className="text-[11px] text-stone-700 bg-stone-50 p-2 rounded-xl border border-stone-200">
                          {myItems.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>

                        <button
                          onClick={() => store.updateTenantOrderStatus(ord.id, currentTenant.id, 'completed')}
                          className="w-full py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 border border-stone-200"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Serahkan ke Pelanggan (Selesai)</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 3: Selesai (Completed Today) */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-between shadow-xs">
                <span className="font-extrabold text-stone-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-stone-500" />
                  <span>Selesai Diserahkan ({completedOrders.length})</span>
                </span>
                <span className="text-[10px] text-stone-500 font-medium">Hari ini</span>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {completedOrders.length === 0 ? (
                  <div className="p-6 text-center bg-white border border-stone-200 rounded-xl text-stone-500 text-xs shadow-xs">
                    Riwayat pesanan yang sudah diambil akan muncul di sini.
                  </div>
                ) : (
                  completedOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-2.5 rounded-xl bg-white border border-stone-200 text-xs space-y-1 shadow-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-stone-800">
                          #{ord.orderNumber} (Meja {ord.tableNumber})
                        </span>
                        <span className="text-[10px] text-stone-500">{ord.customerName}</span>
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {ord.tenantStatuses[currentTenant.id]?.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INPUT PESANAN RAMAH USER (POS BOOTH) */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left Grid (7 cols): Touch-friendly Menu Grid */}
          <div className="lg:col-span-7 space-y-3">
            <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-xs shadow-xs">
              <span className="font-bold text-stone-800">Katalog Menu {currentTenant.name}</span>
              <span className="text-stone-500 text-[11px] font-medium">{menuItems.length} produk siap jual</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {menuItems.map((item) => {
                const inCart = posCart.find((ci) => ci.menuItemId === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => item.isAvailable && handlePosAddToCart(item)}
                    className={`p-2 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                      !item.isAvailable
                        ? 'bg-stone-50 border-stone-200 opacity-50 cursor-not-allowed'
                        : inCart
                        ? 'bg-amber-50 border-amber-400 shadow-sm ring-1 ring-amber-400'
                        : 'bg-white border-stone-200 hover:border-amber-300 hover:bg-stone-50/50 shadow-xs'
                    }`}
                  >
                    <div className="relative h-24 w-full rounded-xl overflow-hidden bg-stone-100 mb-2">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {inCart && (
                        <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          {inCart.quantity}
                        </span>
                      )}
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center text-white font-bold text-[10px]">
                          HABIS
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-stone-900 text-[11px] leading-tight line-clamp-2">{item.name}</h4>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-extrabold text-amber-700 text-[11px]">{formatIDR(item.price)}</span>
                        {item.isAvailable && (
                          <button
                            type="button"
                            className="p-1 rounded-lg bg-stone-100 hover:bg-amber-500 hover:text-white text-stone-700 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Grid (5 cols): Ringkasan Pesanan & Kirim ke Kasir */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-stone-900">Input Pesanan Pelanggan</h3>
                </div>
                <span className="text-[10px] text-stone-500 font-medium">Diteruskan ke Kasir</span>
              </div>

              {posSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{posSuccessMsg}</span>
                </div>
              )}

              {/* Table & Customer Form */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-600 text-[10px] mb-1 font-semibold">Nomor Meja</label>
                  <select
                    value={posTable}
                    onChange={(e) => setPosTable(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1.5 text-stone-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                  >
                    {tables.map((t) => (
                      <option key={t.number} value={t.number}>
                        Meja {t.number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 text-[10px] mb-1 font-semibold">Nama Tamu (Opsional)</label>
                  <input
                    type="text"
                    value={posCustomerName}
                    onChange={(e) => setPosCustomerName(e.target.value)}
                    placeholder="Nama pemesan"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1.5 text-stone-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Cart Item List */}
              <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200 max-h-56 overflow-y-auto">
                {posCart.length === 0 ? (
                  <div className="py-6 text-center text-stone-500 text-xs">
                    Keranjang masih kosong. Klik menu di samping untuk menambahkan pesanan.
                  </div>
                ) : (
                  posCart.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white border border-stone-200 shadow-2xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-stone-800 truncate">{item.name}</div>
                        <div className="text-[10px] text-stone-500">{formatIDR(item.price)}</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePosRemoveFromCart(item.menuItemId)}
                          className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-stone-800 w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const origin = menuItems.find((m) => m.id === item.menuItemId);
                            if (origin) handlePosAddToCart(origin);
                          }}
                          className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="font-bold text-amber-700 text-[11px] w-16 text-right">
                        {formatIDR(item.subtotal)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total & Submit */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-stone-800">
                  <span>Total Pesanan:</span>
                  <span className="text-amber-700 font-extrabold text-base">{formatIDR(posTotalAmount)}</span>
                </div>

                <button
                  type="button"
                  disabled={posCart.length === 0}
                  onClick={handleSubmitPosOrder}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-xs text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim ke Kasir Pusat ({formatIDR(posTotalAmount)})</span>
                </button>

                <p className="text-[10px] text-center text-stone-500">
                  Pesanan akan berstatus <em>Unpaid</em> di layar Kasir. Setelah dibayar, notifikasi masak otomatis masuk.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KELOLA MENU & TAMBAH MENU MAKANAN */}
      {activeTab === 'menu' && (
        <div className="space-y-3">
          {/* Header Action Bar */}
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-600" />
                <span>Kelola Menu & Tambah Makanan ({currentTenant.name})</span>
              </h3>
              <p className="text-xs text-stone-500">
                Tambah kreasi menu baru, ubah harga, dan atur ketersediaan stok secara realtime
              </p>
            </div>

            <button
              onClick={() => setShowAddMenuModal(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Menu Makanan</span>
            </button>
          </div>

          {/* Toast Notification */}
          {menuSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">{menuSuccessMsg}</span>
              </div>
              <button
                onClick={() => setMenuSuccessMsg('')}
                className="text-emerald-600 hover:text-emerald-900 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Menu Items List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {menuItems.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white border border-dashed border-stone-300 rounded-2xl">
                <ChefHat className="w-10 h-10 mx-auto text-stone-400 mb-2" />
                <p className="font-bold text-stone-700 text-sm">Belum ada menu di booth ini</p>
                <p className="text-xs text-stone-500 mb-3">Klik tombol di atas untuk menambahkan menu makanan perdana</p>
                <button
                  onClick={() => setShowAddMenuModal(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs"
                >
                  + Tambah Menu Sekarang
                </button>
              </div>
            ) : (
              menuItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-between gap-3 text-xs hover:border-amber-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {item.spicyLevelAvailable && (
                        <div className="absolute top-1 left-1 bg-red-500/90 text-white rounded p-0.5">
                          <Flame className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-stone-900 truncate">{item.name}</h4>
                      <p className="text-amber-700 font-bold text-[11px]">{formatIDR(item.price)}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded font-medium uppercase">
                          {item.category}
                        </span>
                        {item.spicyLevelAvailable && (
                          <span className="text-[9px] text-red-600 font-medium">Bisa Pedas</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Toggle Status Stok */}
                    <button
                      onClick={() => store.toggleMenuItemAvailability(item.id)}
                      className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                        item.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                      }`}
                      title="Ubah ketersediaan stok"
                    >
                      {item.isAvailable ? 'Tersedia' : 'Habis'}
                    </button>

                    {/* Delete Item */}
                    <button
                      onClick={() => handleDeleteMenuItem(item)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                      title="Hapus Menu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL TAMBAH MENU MAKANAN BARU */}
      {showAddMenuModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl text-stone-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddMenuModal(false)}
              className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 text-xs"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-stone-100">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Tambah Menu Makanan Baru</h3>
                <p className="text-xs text-stone-500">Booth: {currentTenant.name}</p>
              </div>
            </div>

            <form onSubmit={handleCreateMenuItem} className="space-y-3.5 text-xs">
              {/* Nama Menu */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Nama Menu Makanan / Minuman <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Soto Daging Madura Spesial"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50 focus:bg-white text-xs"
                />
              </div>

              {/* Kategori & Harga */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Kategori Menu</label>
                  <select
                    value={newMenuCategory}
                    onChange={(e) => setNewMenuCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50 focus:bg-white text-xs"
                  >
                    <option value="makanan">Makanan Utama</option>
                    <option value="minuman">Minuman Segar</option>
                    <option value="snack">Camilan / Snack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Harga Jual (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={newMenuPrice}
                    onChange={(e) => setNewMenuPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50 focus:bg-white text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi kelezatan, bumbu rempah, porsi sajian..."
                  value={newMenuDesc}
                  onChange={(e) => setNewMenuDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50 focus:bg-white text-xs resize-none"
                />
              </div>

              {/* Pilihan Foto Cepat (Preset) */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Pilih Foto Makanan Siap Pakai (Atau masukkan URL)
                </label>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {PRESET_FOOD_IMAGES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setNewMenuImage(preset.url)}
                      className={`p-1 rounded-lg border text-[10px] flex flex-col items-center gap-1 transition-all ${
                        newMenuImage === preset.url
                          ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-400 font-bold text-amber-900'
                          : 'border-stone-200 hover:border-stone-300 text-stone-600'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-8 object-cover rounded"
                        referrerPolicy="no-referrer"
                      />
                      <span className="truncate w-full text-center leading-tight">{preset.label}</span>
                    </button>
                  ))}
                </div>

                <input
                  type="url"
                  placeholder="Atau tempel URL gambar custom di sini..."
                  value={newMenuImage}
                  onChange={(e) => setNewMenuImage(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-[11px] bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Opsi Level Pedas */}
              <div className="flex items-center gap-2 p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
                <input
                  type="checkbox"
                  id="spicyToggle"
                  checked={newMenuSpicy}
                  onChange={(e) => setNewMenuSpicy(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="spicyToggle" className="cursor-pointer text-stone-700 font-medium select-none">
                  Sediakan opsi level kepedasan untuk menu ini (Pelanggan bisa memilih Level 0 - 5)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  Simpan Menu Makanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
