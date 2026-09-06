import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  CreditCard,
  ChefHat,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  Clock,
  Receipt
} from 'lucide-react';
import { Order } from '../types';
import { formatIDR } from '../services/store';
import { soundService } from '../utils/audio';

interface OrderTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onTrackOrder: () => void;
}

export const OrderTokenModal: React.FC<OrderTokenModalProps> = ({
  isOpen,
  onClose,
  order,
  onTrackOrder
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const handleCopyCode = () => {
    soundService.playClick();
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4 text-stone-800 relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Decorative Header */}
        <div className="relative flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900">
                {isPaid ? 'Pesanan Sedang Diproses' : 'Kode Pemesanan Meja'}
              </h3>
              <p className="text-[11px] text-stone-500">
                Tersimpan otomatis di perangkat ini
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors"
            title="Tutup Pop-up"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Voucher Token Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg space-y-3 relative overflow-hidden">
          {/* Subtle Watermark Pattern */}
          <div className="absolute -right-4 -bottom-4 text-white/10 select-none pointer-events-none">
            <Receipt className="w-32 h-32" />
          </div>

          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-black/20 text-amber-100 uppercase backdrop-blur-xs">
              KODE RESMI PEMESANAN
            </span>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-lg backdrop-blur-xs">
              {order.tableNumber ? `Meja ${order.tableNumber}` : 'Takeaway'}
            </span>
          </div>

          <div className="text-center py-2 space-y-1">
            <p className="text-xs text-amber-100 uppercase tracking-widest font-medium">
              Tunjukkan Kode Ini ke Kasir Sentral
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-white drop-shadow-xs">
                {order.id}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                title="Salin Kode Pemesanan"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && (
              <p className="text-[10px] text-emerald-200 font-semibold animate-in fade-in">
                ✓ Kode berhasil disalin ke clipboard!
              </p>
            )}
          </div>

          <div className="pt-2.5 border-t border-white/20 flex items-center justify-between text-xs">
            <div>
              <span className="text-amber-100 text-[10px] block">Atas Nama:</span>
              <span className="font-bold text-white">{order.customerName}</span>
            </div>
            <div className="text-right">
              <span className="text-amber-100 text-[10px] block">Total Tagihan:</span>
              <span className="text-base font-extrabold text-white">
                {formatIDR(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Step-by-Step Instructions Banner */}
        <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-stone-900">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cara Menyelesaikan Pesanan:</span>
          </div>
          <ol className="space-y-1.5 text-stone-600 text-[11px] list-decimal list-inside leading-relaxed">
            <li>
              Datangi <strong className="text-stone-900">Loket Kasir Sentral</strong> Food Court.
            </li>
            <li>
              Sebutkan kode pemesanan <strong className="text-amber-700 font-mono font-bold">{order.id}</strong> atau nomor meja <strong className="text-stone-900">Meja {order.tableNumber}</strong>.
            </li>
            <li>
              Lakukan pembayaran dengan <strong className="text-stone-900">Tunai, QRIS, atau Kartu Debit</strong>.
            </li>
            <li>
              Setelah lunas, dapur booth otomatis memasak dan HP Anda akan berbunyi saat pesanan siap diambil!
            </li>
          </ol>
        </div>

        {/* Device Persistence Assurance Badge */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs">
          <Clock className="w-4 h-4 text-sky-600 flex-shrink-0" />
          <p className="text-[11px] leading-tight">
            <strong>Jangan khawatir:</strong> Riwayat dan kode ini otomatis melekat di browser HP Anda. Anda bisa menutup tab ini dan membukanya kapan saja saat di meja.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={() => {
              onClose();
              onTrackOrder();
            }}
            className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Pantau Status Dapur Realtime</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Tutup & Belanja Lagi
          </button>
        </div>

      </div>
    </div>
  );
};
