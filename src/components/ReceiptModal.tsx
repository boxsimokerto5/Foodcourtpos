import React from 'react';
import { CheckCircle2, Printer, Share2, Ticket, X } from 'lucide-react';
import { Order, TenantOrderStatus } from '../types';
import { formatIDR } from '../services/store';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-sm w-full p-4 shadow-2xl text-stone-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-stone-900">Struk Pembayaran Sah</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 text-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Preview (Thermal Paper Look) */}
        <div className="my-3 overflow-y-auto pr-1">
          <div className="bg-stone-50 text-stone-900 p-4 rounded-xl shadow-xs font-mono text-[11px] leading-relaxed border border-stone-200">
            <div className="text-center pb-3 border-b border-dashed border-stone-300">
              <h2 className="text-sm font-black tracking-wider uppercase text-stone-900">FOOD COURT NUSANTARA</h2>
              <p className="text-[10px] text-stone-500">Layanan Kasir Terpadu Multi-Tenant</p>
              <p className="text-[10px] text-stone-400">Jl. Kuliner Utama No. 88, Food Center</p>
            </div>

            {/* Meta */}
            <div className="py-2.5 border-b border-dashed border-stone-300 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-stone-500">No. Pesanan:</span>
                <span className="font-bold text-stone-900">#{order.orderNumber} ({order.id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Nomor Meja:</span>
                <span className="font-bold text-stone-900">Meja {order.tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Pelanggan:</span>
                <span className="text-stone-800">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Waktu Bayar:</span>
                <span className="text-stone-800">{new Date(order.paymentTime || order.createdAt).toLocaleTimeString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Kasir:</span>
                <span className="text-stone-800">{order.cashierName || 'Kasir Sentral'}</span>
              </div>
            </div>

            {/* Items */}
            <div className="py-2.5 border-b border-dashed border-stone-300 space-y-2">
              <div className="font-bold text-[10px] uppercase text-stone-700">Rincian Menu:</div>
              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-semibold text-stone-900">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>{formatIDR(item.subtotal)}</span>
                  </div>
                  <div className="text-[9px] text-stone-500 flex justify-between pl-3">
                    <span>{item.tenantName}</span>
                    {item.spicyLevel !== undefined && <span>(Pedas Lvl {item.spicyLevel})</span>}
                  </div>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <div className="text-[9px] text-stone-500 pl-3">
                      + {item.selectedOptions.map((o) => o.name).join(', ')}
                    </div>
                  )}
                  {item.notes && <div className="text-[9px] italic text-stone-500 pl-3">Note: {item.notes}</div>}
                </div>
              ))}
            </div>

            {/* Total Calculation */}
            <div className="py-2.5 border-b border-dashed border-stone-300 space-y-1">
              <div className="flex justify-between text-xs font-black text-stone-900">
                <span>TOTAL AKHIR:</span>
                <span className="text-amber-700">{formatIDR(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-stone-600">
                <span>Metode Bayar:</span>
                <span className="uppercase font-bold">{order.paymentMethod || 'TUNAI'}</span>
              </div>
              <div className="flex justify-between text-[10px] text-stone-600">
                <span>Diterima:</span>
                <span>{formatIDR(order.amountPaid || order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-stone-600">
                <span>Kembalian:</span>
                <span>{formatIDR(order.change || 0)}</span>
              </div>
            </div>

            {/* Barcode & Footer */}
            <div className="pt-3 text-center space-y-1">
              <div className="tracking-[0.25em] text-[10px] font-mono text-stone-700">
                * * * {order.id} * * *
              </div>
              <p className="text-[9px] text-stone-500">
                Status: <span className="text-emerald-600 font-bold uppercase">LUNAS / TERBAYAR</span>
              </p>
              <p className="text-[9px] text-stone-400">
                Pesanan telah otomatis diteruskan ke dapur tenant. Harap simpan struk ini untuk verifikasi saat pengambilan.
              </p>
            </div>
          </div>

          {/* Separate Kitchen Voucher Tickets */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800">
              <Ticket className="w-3.5 h-3.5 text-amber-600" />
              <span>Tiket Ambil Makanan per Booth:</span>
            </div>
            {(Object.values(order.tenantStatuses) as TenantOrderStatus[]).map((ts, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-amber-950">{ts.tenantName}</div>
                  <div className="text-[10px] text-stone-500">
                    {ts.items.length > 0 ? ts.items.map((i) => `${i.quantity}x ${i.name}`).join(', ') : 'Menu Pesanan'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold border border-amber-200">
                    Kupon #{order.orderNumber}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-stone-100 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-stone-200"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Thermal</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
