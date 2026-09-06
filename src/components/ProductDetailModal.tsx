import React, { useState, useMemo } from 'react';
import { ChefHat, Flame, Minus, Plus, ShoppingBag, Sparkles, X } from 'lucide-react';
import { MenuItem, OrderItem, SelectedOption } from '../types';
import { formatIDR } from '../services/store';
import { soundService } from '../utils/audio';

interface ProductDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (orderItem: OrderItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ item, onClose, onAddToCart }) => {
  if (!item) return null;

  const [quantity, setQuantity] = useState(1);
  const [spicyLevel, setSpicyLevel] = useState<number>(item.spicyLevelAvailable ? 1 : 0);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [notes, setNotes] = useState('');

  // Calculate live total price
  const basePrice = item.price;
  const optionsPrice = useMemo(() => {
    return selectedOptions.reduce((sum, opt) => sum + opt.price, 0);
  }, [selectedOptions]);

  const unitPrice = basePrice + optionsPrice;
  const totalPrice = unitPrice * quantity;

  const handleToggleOption = (opt: { id: string; name: string; price: number }) => {
    const exists = selectedOptions.some((o) => o.optionId === opt.id);
    if (exists) {
      setSelectedOptions(selectedOptions.filter((o) => o.optionId !== opt.id));
    } else {
      setSelectedOptions([...selectedOptions, { optionId: opt.id, name: opt.name, price: opt.price }]);
    }
    soundService.playClick();
  };

  const handleAdd = () => {
    const orderItem: OrderItem = {
      menuItemId: item.id,
      name: item.name,
      price: unitPrice,
      quantity,
      tenantId: item.tenantId,
      tenantName: item.tenantName,
      spicyLevel: item.spicyLevelAvailable ? spicyLevel : undefined,
      notes: notes.trim() || undefined,
      selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
      subtotal: totalPrice,
    };
    soundService.playCashierSuccess();
    onAddToCart(orderItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 rounded-t-3xl sm:rounded-2xl max-w-md w-full overflow-hidden shadow-2xl text-stone-800 max-h-[90vh] flex flex-col">
        {/* Product Image Header */}
        <div className="relative h-48 sm:h-52 w-full bg-stone-100 flex-shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 via-transparent to-black/20" />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white text-stone-700 shadow-sm backdrop-blur-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badges */}
          <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 text-[10px] font-bold shadow-xs">
              {item.tenantName}
            </span>
            {item.isBestSeller && (
              <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3" /> Best Seller
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Title & Base Price */}
          <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-stone-900">{item.name}</h2>
              <p className="text-stone-500 text-[11px] leading-relaxed mt-1">{item.description}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-amber-600 font-extrabold text-base">{formatIDR(item.price)}</span>
              <span className="block text-[10px] text-stone-400">Harga dasar</span>
            </div>
          </div>

          {/* Spicy Level Selector (if available) */}
          {item.spicyLevelAvailable && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-stone-700">
                <span className="font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-500" /> Tingkat Kepedasan:
                </span>
                <span className="font-bold text-rose-600">
                  {spicyLevel === 0
                    ? 'Tidak Pedas'
                    : spicyLevel === 1
                    ? 'Level 1 (Sedang)'
                    : spicyLevel === 2
                    ? 'Level 2 (Pedas)'
                    : spicyLevel === 3
                    ? 'Level 3 (Ekstra Pedas)'
                    : `Level ${spicyLevel} (Nampol!)`}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setSpicyLevel(lvl);
                      soundService.playClick();
                    }}
                    className={`py-1.5 rounded-lg border text-center transition-all ${
                      spicyLevel === lvl
                        ? 'bg-rose-50 border-rose-400 text-rose-700 font-bold shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Lvl {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Options & Toppings */}
          {item.options && item.options.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-semibold text-stone-700 block">Pilihan Ekstra & Topping:</span>
              <div className="space-y-1.5">
                {item.options.map((opt) => {
                  const isChecked = selectedOptions.some((o) => o.optionId === opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleToggleOption(opt)}
                      className={`w-full p-2 rounded-xl border flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-amber-50 border-amber-300 text-amber-950 font-medium'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                            isChecked ? 'bg-amber-500 border-amber-500 text-white font-bold' : 'border-stone-400 bg-white'
                          }`}
                        >
                          {isChecked ? '✓' : ''}
                        </div>
                        <span className="font-medium text-[11px]">{opt.name}</span>
                      </div>
                      <span className="text-amber-700 font-semibold text-[11px]">+{formatIDR(opt.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen Notes */}
          <div className="space-y-1">
            <label className="text-stone-600 text-[11px] font-medium block">
              Catatan Khusus untuk Koki Tenant (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: jangan pakai daun bawang, kuah dipisah..."
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Bottom Action Footer with Quantity & Live Total */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 flex-shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl p-1 shadow-xs">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => {
                setQuantity(Math.max(1, quantity - 1));
                soundService.playClick();
              }}
              className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-stone-700 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-sm w-5 text-center text-stone-800">{quantity}</span>
            <button
              type="button"
              onClick={() => {
                setQuantity(quantity + 1);
                soundService.playClick();
              }}
              className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart with live computed price */}
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs text-xs flex items-center justify-between transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              <span>Tambah</span>
            </div>
            <span className="text-sm font-black tracking-tight">{formatIDR(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
