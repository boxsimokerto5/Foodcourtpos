import React, { useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Printer,
  QrCode,
  Search,
  Store,
  User,
  Utensils,
  Volume2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order, TenantOrderStatus } from '../types';
import { store, formatIDR } from '../services/store';
import { ReceiptModal } from '../components/ReceiptModal';
import { soundService } from '../utils/audio';

export const KasirPage: React.FC = () => {
  const orders = store.getOrders();
  const unpaidOrders = orders.filter((o) => o.paymentStatus === 'unpaid');
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(unpaidOrders[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'debit'>('cash');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');

  // Filter orders by search query
  const filteredUnpaid = unpaidOrders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.tableNumber.includes(searchQuery) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPaid = paidOrders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.tableNumber.includes(searchQuery) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // When selectedOrder changes, set default cash amount to totalAmount
  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setCashAmount(order.totalAmount);
    soundService.playClick();
  };

  // Quick cash buttons
  const cashPresets = [
    { label: 'Uang Pas', value: selectedOrder?.totalAmount || 0 },
    { label: 'Rp 50.000', value: 50000 },
    { label: 'Rp 100.000', value: 100000 },
    { label: 'Rp 200.000', value: 200000 },
  ];

  const calculatedChange = selectedOrder ? Math.max(0, cashAmount - selectedOrder.totalAmount) : 0;
  const isCashSufficient = selectedOrder ? cashAmount >= selectedOrder.totalAmount : false;

  const handleConfirmPayment = () => {
    if (!selectedOrder) return;

    const amount = paymentMethod === 'cash' ? cashAmount : selectedOrder.totalAmount;
    const res = store.payOrder(selectedOrder.id, paymentMethod, amount);

    if (res.success && res.order) {
      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setReceiptOrder(res.order);
      // Select next unpaid order
      const remaining = unpaidOrders.filter((o) => o.id !== selectedOrder.id);
      setSelectedOrder(remaining[0] || null);
    }
  };

  return (
    <div className="space-y-3 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-stone-900 tracking-tight">Kasir Sentral Food Court</h1>
            <p className="text-xs text-stone-600">
              Konfirmasi pembayaran untuk otomatis memberitahukan dapur tenant agar menyiapkan pesanan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium">{unpaidOrders.length} Pesanan Mengantre</span>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Order Queue & Payment Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column (5 cols): Antrean Pesanan */}
        <div className="lg:col-span-5 space-y-2">
          {/* Search & Tabs */}
          <div className="bg-white border border-stone-200 rounded-2xl p-2.5 space-y-2 shadow-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Masukkan Kode Pemesanan (FC-...) atau No. Meja..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-1 text-xs">
              <button
                onClick={() => setActiveTab('unpaid')}
                className={`py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'unpaid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                Belum Bayar ({unpaidOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('paid')}
                className={`py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'paid'
                    ? 'bg-stone-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                Sudah Lunas ({paidOrders.length})
              </button>
            </div>
          </div>

          {/* List of Orders */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {activeTab === 'unpaid' ? (
              filteredUnpaid.length === 0 ? (
                <div className="p-8 text-center bg-white border border-stone-200 rounded-2xl text-stone-500 text-xs shadow-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-stone-800">Semua pesanan lunas!</p>
                  <p className="text-[11px] text-stone-500">Belum ada pesanan baru yang menunggu pembayaran.</p>
                </div>
              ) : (
                filteredUnpaid.map((ord) => {
                  const isSelected = selectedOrder?.id === ord.id;
                  return (
                    <div
                      key={ord.id}
                      onClick={() => handleSelectOrder(ord)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all text-xs ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-500 shadow-xs text-stone-900 ring-1 ring-emerald-500/50'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-300 hover:bg-stone-50/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 font-mono font-bold text-stone-800 text-[11px] border border-stone-200">
                            #{ord.orderNumber}
                          </span>
                          <span className="font-bold text-stone-900">Meja {ord.tableNumber}</span>
                        </div>
                        <span className="font-extrabold text-amber-700 text-sm">{formatIDR(ord.totalAmount)}</span>
                      </div>

                      <div className="text-[11px] text-stone-600 mb-1 flex items-center justify-between">
                        <span>{ord.customerName}</span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(ord.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Summary of items */}
                      <div className="text-[10px] text-stone-500 line-clamp-1">
                        {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>

                      {/* Multi-tenant indicator */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(Object.values(ord.tenantStatuses) as TenantOrderStatus[]).map((ts, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 text-[9px] border border-stone-200"
                          >
                            {ts.tenantName.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* Paid orders list */
              filteredPaid.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setReceiptOrder(ord)}
                  className="p-3 rounded-2xl bg-white border border-stone-200 text-xs hover:border-emerald-300 hover:bg-stone-50 cursor-pointer space-y-1 shadow-xs"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-800">#{ord.orderNumber}</span>
                      <span className="text-stone-500">Meja {ord.tableNumber}</span>
                    </div>
                    <span className="font-bold text-emerald-700">{formatIDR(ord.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-stone-500">
                    <span>{ord.customerName} • {ord.paymentMethod?.toUpperCase()}</span>
                    <button className="text-emerald-700 font-medium hover:underline flex items-center gap-1">
                      <Printer className="w-3 h-3" /> Cetak Ulang
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Payment Console */}
        <div className="lg:col-span-7">
          {selectedOrder && selectedOrder.paymentStatus === 'unpaid' ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-4 text-xs">
              {/* Order Header */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-stone-900">Pesanan #{selectedOrder.orderNumber}</h2>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                      Menunggu Pembayaran
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Meja {selectedOrder.tableNumber} • Atas Nama: <strong className="text-stone-800">{selectedOrder.customerName}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-stone-500">Total Tagihan</div>
                  <div className="text-xl font-black text-amber-700">{formatIDR(selectedOrder.totalAmount)}</div>
                </div>
              </div>

              {/* Items Breakdown Grouped by Tenant */}
              <div className="space-y-2.5 bg-stone-50 p-3 rounded-xl border border-stone-200">
                <div className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
                  <span>Rincian Pembagian Tenant:</span>
                  <span className="text-[10px] text-stone-500">{selectedOrder.items.length} item</span>
                </div>

                {(Object.values(selectedOrder.tenantStatuses) as TenantOrderStatus[]).map((ts, idx) => (
                  <div key={idx} className="border-t border-stone-200 pt-2 first:border-0 first:pt-0">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-amber-900 mb-1">
                      <span className="flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-amber-600" />
                        {ts.tenantName}
                      </span>
                      <span>Subtotal: {formatIDR(ts.subtotal)}</span>
                    </div>

                    <div className="space-y-1 pl-4">
                      {ts.items.map((item, iIdx) => (
                        <div key={iIdx} className="flex justify-between text-[11px] text-stone-600">
                          <span>
                            {item.quantity}x {item.name}
                            {item.selectedOptions && (
                              <span className="text-[9px] text-stone-400 block">
                                + {item.selectedOptions.map((o) => o.name).join(', ')}
                              </span>
                            )}
                            {item.notes && <span className="text-[9px] italic text-stone-400 block">Note: {item.notes}</span>}
                          </span>
                          <span className="text-stone-800 font-medium">{formatIDR(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="text-stone-700 text-[11px] font-semibold block">Pilih Metode Pembayaran:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('cash');
                      soundService.playClick();
                    }}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Tunai (Cash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('qris');
                      soundService.playClick();
                    }}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'qris'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QRIS Dinamis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('debit');
                      soundService.playClick();
                    }}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'debit'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Kartu Debit</span>
                  </button>
                </div>
              </div>

              {/* Cash Denominations and Change Calculator */}
              {paymentMethod === 'cash' && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-stone-700 font-medium">Uang Diterima dari Pelanggan:</label>
                    <input
                      type="number"
                      value={cashAmount || ''}
                      onChange={(e) => setCashAmount(Number(e.target.value))}
                      className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-right text-stone-900 font-mono font-bold text-sm w-36 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {cashPresets.map((pr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCashAmount(pr.value);
                          soundService.playClick();
                        }}
                        className={`py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                          cashAmount === pr.value
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {pr.label}
                      </button>
                    ))}
                  </div>

                  {/* Kembalian Box */}
                  <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                    <span className="text-[11px] text-stone-600 font-medium">Uang Kembalian:</span>
                    <span
                      className={`text-base font-mono font-extrabold ${
                        isCashSufficient ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {isCashSufficient ? formatIDR(calculatedChange) : 'Uang Kurang!'}
                    </span>
                  </div>
                </div>
              )}

              {/* QRIS Interactive Display */}
              {paymentMethod === 'qris' && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center space-y-2">
                  <div className="text-[11px] text-stone-700 font-semibold">Tunjukkan QRIS Dinamis ke Pelanggan</div>
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-stone-200 shadow-xs flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=qris-foodcourt-${selectedOrder.id}-${selectedOrder.totalAmount}`}
                      alt="QRIS Food Court"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500">Scan via GoPay, OVO, BCA Mobile, ShopeePay, Dana</p>
                </div>
              )}

              {/* Big Confirm Button */}
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  disabled={paymentMethod === 'cash' && !isCashSufficient}
                  onClick={handleConfirmPayment}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-xs text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Konfirmasi Pembayaran ({formatIDR(selectedOrder.totalAmount)})</span>
                </button>

                <p className="text-[10px] text-center text-stone-500">
                  ⚡ Notifikasi otomatis & nada dering lonceng akan langsung dikirim ke dapur tenant bersangkutan.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[350px] bg-white border border-stone-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-stone-500 shadow-xs">
              <CreditCard className="w-12 h-12 text-stone-300 mb-2" />
              <p className="font-semibold text-stone-700 text-sm">Pilih pesanan di sebelah kiri</p>
              <p className="text-xs max-w-xs mt-1 text-stone-500">
                Klik kartu pesanan yang belum dibayar untuk memproses pembayaran dan mencetak struk.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Thermal Receipt Preview Modal */}
      <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
    </div>
  );
};
