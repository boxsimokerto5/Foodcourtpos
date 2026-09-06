import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Clock,
  ExternalLink,
  Flame,
  Minus,
  Plus,
  QrCode,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Ticket,
  User,
  Utensils,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MenuItem, Order, OrderItem, SelectedOption, TenantOrderStatus } from '../types';
import { store, formatIDR } from '../services/store';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { OrderTokenModal } from '../components/OrderTokenModal';
import { soundService } from '../utils/audio';

export const CustomerSelfServicePage: React.FC = () => {
  const tenants = store.getTenants();
  const allMenu = store.getMenu();
  const tables = store.getTables();
  const allOrders = store.getOrders();

  // URL Table detection
  const [tableNumber, setTableNumber] = useState<string>(store.getSelectedTable() || '04');
  const [customerName, setCustomerName] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'makanan' | 'minuman' | 'snack'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Active product for detail modal
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  // Completed / Active self-service order tracking & device history
  const [activeCustomerOrderId, setActiveCustomerOrderId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const savedIds = store.getCustomerDeviceOrderIds();
      return savedIds.length > 0 ? savedIds[0] : null;
    }
    return null;
  });
  const [showTrackOrderTab, setShowTrackOrderTab] = useState(false);
  const [showOrderTokenModal, setShowOrderTokenModal] = useState(false);

  // Initialize table from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTable = params.get('table');
      if (urlTable) {
        setTableNumber(urlTable);
        store.setSelectedTable(urlTable);
      }
    }
  }, []);

  // Filter menu items
  const filteredMenu = allMenu.filter((item) => {
    if (!item.isAvailable) return false;
    if (selectedTenantId !== 'all' && item.tenantId !== selectedTenantId) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tenantName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Cart calculations
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleAddToCart = (orderItem: OrderItem) => {
    setCart((prev) => {
      // Find identical item with same spicy level and options
      const existingIdx = prev.findIndex(
        (i) =>
          i.menuItemId === orderItem.menuItemId &&
          i.spicyLevel === orderItem.spicyLevel &&
          JSON.stringify(i.selectedOptions) === JSON.stringify(orderItem.selectedOptions) &&
          i.notes === orderItem.notes
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        const current = updated[existingIdx];
        const newQty = current.quantity + orderItem.quantity;
        updated[existingIdx] = {
          ...current,
          quantity: newQty,
          subtotal: current.price * newQty,
        };
        return updated;
      }
      return [...prev, orderItem];
    });
  };

  const handleRemoveCartItem = (index: number) => {
    soundService.playClick();
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const order = store.createOrder(
      tableNumber,
      customerName.trim() || `Pelanggan Meja ${tableNumber}`,
      cart,
      'customer'
    );

    // Save to customer's physical device storage automatically
    store.saveCustomerOrderToDevice(order.id);

    soundService.playCashierSuccess();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });

    setActiveCustomerOrderId(order.id);
    setShowCartDrawer(false);
    // Show Pop-up Kode Pemesanan immediately for cashier payment!
    setShowOrderTokenModal(true);
    setCart([]);
  };

  // Find active tracked order
  const trackedOrder = activeCustomerOrderId
    ? allOrders.find((o) => o.id === activeCustomerOrderId)
    : null;

  return (
    <div className="space-y-3 max-w-4xl mx-auto pb-24">
      {/* Mobile-First Header Greeting */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-sky-50/50 border border-sky-200/80 shadow-xs text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-sky-100 text-sky-700 border border-sky-200">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h1 className="text-sm font-extrabold text-stone-900">Self-Service Pesan Mandiri</h1>
              <p className="text-[11px] text-sky-800/80">
                Pesan dari berbagai tenant sekaligus tanpa antre dan tanpa password.
              </p>
            </div>
          </div>

          {/* Table Picker Pill */}
          <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-stone-200 shadow-xs flex-shrink-0">
            <span className="text-[10px] text-stone-500">Meja:</span>
            <select
              value={tableNumber}
              onChange={(e) => {
                setTableNumber(e.target.value);
                store.setSelectedTable(e.target.value);
              }}
              className="bg-transparent text-sky-700 font-extrabold text-xs focus:outline-none cursor-pointer"
            >
              {tables.map((tbl) => (
                <option key={tbl.number} value={tbl.number} className="bg-white text-stone-800">
                  Meja {tbl.number}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer Name Input Optional */}
        <div className="mt-2.5 pt-2 border-t border-sky-100 flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ketik nama Anda (Contoh: Dimas / Maya) untuk di struk..."
            className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-sky-500 shadow-xs"
          />
        </div>
      </div>

      {/* Track Active Order Alert (if customer already has an order or device order) */}
      {trackedOrder && (
        <div className="p-3 rounded-2xl bg-white border-2 border-sky-400 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div
            onClick={() => setShowTrackOrderTab(true)}
            className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-800 font-bold border border-sky-200 flex-shrink-0">
              #{trackedOrder.orderNumber}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-stone-900">Pesanan #{trackedOrder.orderNumber}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    trackedOrder.paymentStatus === 'unpaid'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : trackedOrder.overallStatus === 'ready'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                      : 'bg-sky-100 text-sky-800 border border-sky-300'
                  }`}
                >
                  {trackedOrder.paymentStatus === 'unpaid'
                    ? 'Menunggu Bayar di Kasir'
                    : trackedOrder.overallStatus === 'ready'
                    ? '🔔 SIAP DIAMBIL DI BOOTH!'
                    : 'Sedang Dimasak di Dapur'}
                </span>
                <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-md border border-stone-200 font-mono">
                  {trackedOrder.id}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5 truncate">
                {trackedOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')} • {formatIDR(trackedOrder.totalAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowOrderTokenModal(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Lihat Kode Kasir</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTrackOrderTab(true)}
              className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl border border-sky-200 transition-colors"
              title="Pantau Status Dapur"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Tenants & Categories */}
      <div className="space-y-2">
        {/* Tenant Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => {
              setSelectedTenantId('all');
              soundService.playClick();
            }}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedTenantId === 'all'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 shadow-xs'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Semua Tenant ({tenants.length})</span>
          </button>

          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTenantId(t.id);
                soundService.playClick();
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedTenantId === t.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 shadow-xs'
              }`}
            >
              <span>{t.logo}</span>
              <span>{t.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Category Filter & Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari soto, geprek, kopi, dimsum..."
              className="w-full bg-white border border-stone-200 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-sky-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shadow-xs text-xs">
            {(['all', 'makanan', 'minuman', 'snack'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium capitalize transition-colors ${
                  selectedCategory === cat ? 'bg-stone-100 text-stone-900 font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {cat === 'all' ? 'Semua' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {filteredMenu.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedMenuItem(item)}
            className="group p-2.5 rounded-2xl bg-white border border-stone-200 hover:border-sky-400 transition-all text-xs cursor-pointer flex flex-col justify-between hover:shadow-md shadow-xs"
          >
            <div>
              <div className="relative h-28 sm:h-32 w-full rounded-xl overflow-hidden bg-stone-100 mb-2">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-transparent" />

                {item.isBestSeller && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold text-[9px] flex items-center gap-0.5 shadow-xs">
                    <Sparkles className="w-2.5 h-2.5" /> Terlaris
                  </span>
                )}

                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-white/90 text-stone-700 text-[9px] font-medium border border-stone-200 shadow-xs">
                  {item.tenantName.split(' ')[0]}
                </span>
              </div>

              <h3 className="font-bold text-stone-900 text-xs leading-tight line-clamp-2">{item.name}</h3>
              <p className="text-stone-500 text-[10px] leading-normal line-clamp-2 mt-1">{item.description}</p>
            </div>

            <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="font-extrabold text-amber-700 text-xs sm:text-sm">{formatIDR(item.price)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMenuItem(item);
                }}
                className="py-1 px-2 rounded-lg bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 hover:border-sky-600 text-[11px] font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Pilih</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Sticky Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-40">
          <div className="p-3 bg-white/95 backdrop-blur-md border border-sky-200 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white font-black flex items-center justify-center relative shadow-xs">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <div className="text-[11px] text-stone-500">Total {totalCartCount} Menu:</div>
                <div className="text-sm font-black text-amber-700">{formatIDR(totalCartAmount)}</div>
              </div>
            </div>

            <button
              onClick={() => setShowCartDrawer(true)}
              className="py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
            >
              <span>Lihat Pesanan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        item={selectedMenuItem}
        onClose={() => setSelectedMenuItem(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Review & Checkout Drawer */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-stone-200 rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl text-stone-800">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-sm text-stone-900">Rincian Keranjang Pesanan</h3>
              </div>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
              <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100 flex justify-between items-center text-[11px]">
                <span className="text-stone-500">Pemesanan untuk:</span>
                <span className="font-bold text-sky-800">
                  Meja {tableNumber} {customerName ? `(${customerName})` : ''}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start justify-between gap-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-stone-900">
                        <span className="text-sky-600">{item.quantity}x</span>
                        <span>{item.name}</span>
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">{item.tenantName}</div>

                      {item.spicyLevel !== undefined && (
                        <div className="text-[10px] text-rose-600 font-medium">Level Pedas: {item.spicyLevel}</div>
                      )}

                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="text-[10px] text-stone-500">
                          + {item.selectedOptions.map((o) => o.name).join(', ')}
                        </div>
                      )}

                      {item.notes && <div className="text-[10px] italic text-stone-500">Note: {item.notes}</div>}
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-amber-700">{formatIDR(item.subtotal)}</div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCartItem(idx)}
                        className="text-[10px] text-rose-600 hover:underline mt-1 block ml-auto font-medium"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Multi-Tenant Notice */}
              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-sky-900">
                💡 Anda dapat memesan dari berbagai booth tenant sekaligus. Setelah checkout, lakukan pembayaran di Kasir
                Sentral agar pesanan langsung disiapkan oleh masing-masing booth.
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-2">
              <div className="flex justify-between items-center text-sm font-black text-stone-900">
                <span>Total Pembayaran:</span>
                <span className="text-amber-700 text-base">{formatIDR(totalCartAmount)}</span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl shadow-xs text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Proses Pesanan Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Order Tracker Modal */}
      {showTrackOrderTab && trackedOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-4 shadow-2xl text-stone-800 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-bold text-sm text-stone-900">Status Live Pesanan Anda</h3>
              </div>
              <button
                onClick={() => setShowTrackOrderTab(false)}
                className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="my-3 overflow-y-auto space-y-3 text-xs pr-1">
              {/* Card Nomor Pesanan */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-center space-y-1">
                <div className="text-[10px] text-stone-500 uppercase tracking-wider">Nomor Antrean Anda:</div>
                <div className="text-3xl font-black text-amber-700 tracking-tight font-mono">
                  #{trackedOrder.orderNumber}
                </div>
                <div className="text-xs text-stone-600">
                  Meja {trackedOrder.tableNumber} • {trackedOrder.customerName}
                </div>
              </div>

              {/* Status Stepper */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="font-bold text-[11px] text-stone-700">Langkah Pemrosesan:</div>

                {/* Step 1: Pembayaran di Kasir */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      trackedOrder.paymentStatus === 'paid'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white animate-pulse'
                    }`}
                  >
                    {trackedOrder.paymentStatus === 'paid' ? '✓' : '1'}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900">
                      {trackedOrder.paymentStatus === 'paid' ? 'Pembayaran Selesai' : 'Bayar ke Kasir Sentral'}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {trackedOrder.paymentStatus === 'paid'
                        ? `Lunas via ${trackedOrder.paymentMethod?.toUpperCase()} (${formatIDR(trackedOrder.totalAmount)})`
                        : `Tunjukkan kode #${trackedOrder.orderNumber} ke Kasir Sentral untuk membayar.`}
                    </div>
                  </div>
                </div>

                {/* Step 2: Proses Masak Tenant */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      trackedOrder.paymentStatus !== 'paid'
                        ? 'bg-stone-200 text-stone-400'
                        : trackedOrder.overallStatus === 'ready'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-sky-600 text-white animate-pulse'
                    }`}
                  >
                    {trackedOrder.overallStatus === 'ready' ? '✓' : '2'}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900">Dapur Menyiapkan Pesanan</div>
                    <div className="text-[10px] text-stone-500">
                      {trackedOrder.paymentStatus === 'paid'
                        ? 'Koki di masing-masing booth sedang memasak pesanan Anda.'
                        : 'Menunggu pembayaran diselesaikan di kasir.'}
                    </div>
                  </div>
                </div>

                {/* Step 3: Pengambilan di Booth */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      trackedOrder.overallStatus === 'ready'
                        ? 'bg-emerald-500 text-white animate-bounce'
                        : 'bg-stone-200 text-stone-400'
                    }`}
                  >
                    {trackedOrder.overallStatus === 'completed' ? '✓' : '3'}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900">Ambil di Booth Tenant</div>
                    <div className="text-[10px] text-stone-500">
                      {trackedOrder.overallStatus === 'ready'
                        ? '🔔 Makanan Anda SIAP DIAMBIL di booth masing-masing!'
                        : 'Tunjukkan nomor antrean saat mengambil pesanan.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Breakdown per Tenant */}
              <div className="space-y-1.5">
                <div className="font-bold text-[11px] text-stone-700">Status Per Booth:</div>
                {(Object.values(trackedOrder.tenantStatuses) as TenantOrderStatus[]).map((ts, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-stone-800">{ts.tenantName}</div>
                      <div className="text-[10px] text-stone-500">
                        {ts.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ts.status === 'ready'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : ts.status === 'cooking'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {ts.status === 'ready'
                        ? 'Siap Diambil'
                        : ts.status === 'cooking'
                        ? 'Dimasak'
                        : 'Menunggu Bayar'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowTrackOrderTab(false)}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Tutup Pelacak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Kode Pemesanan untuk Kasir Sentral */}
      <OrderTokenModal
        isOpen={showOrderTokenModal}
        onClose={() => setShowOrderTokenModal(false)}
        order={trackedOrder}
        onTrackOrder={() => {
          setShowOrderTokenModal(false);
          setShowTrackOrderTab(true);
        }}
      />
    </div>
  );
};
