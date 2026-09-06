import React, { useState } from 'react';
import {
  ChefHat,
  Flame,
  Plus,
  Search,
  Sparkles,
  Store,
  Tag,
  Utensils
} from 'lucide-react';
import { MenuItem, OrderItem } from '../types';
import { store, formatIDR } from '../services/store';
import { ProductDetailModal } from '../components/ProductDetailModal';

interface MenuCatalogPageProps {
  onAddToCart?: (item: OrderItem) => void;
}

export const MenuCatalogPage: React.FC<MenuCatalogPageProps> = ({ onAddToCart }) => {
  const allMenu = store.getMenu();
  const tenants = store.getTenants();

  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'makanan' | 'minuman' | 'snack'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);

  const filtered = allMenu.filter((item) => {
    if (selectedTenant !== 'all' && item.tenantId !== selectedTenant) return false;
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

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Title */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200">
              <Utensils className="w-4 h-4" />
            </span>
            <h1 className="text-base font-extrabold text-stone-900">Katalog Menu & Rincian Harga Spesial</h1>
          </div>
          <p className="text-stone-600 text-xs">
            Eksplorasi kuliner lengkap dari seluruh booth tenant dengan transparansi harga dan pilihan varian.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-stone-500 font-medium">Tersedia {filtered.length} menu siap saji</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-2 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari hidangan favorit Anda..."
            className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-500 shadow-xs"
          />
        </div>

        {/* Tenant Filter */}
        <select
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
        >
          <option value="all">Semua Booth Tenant</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shadow-xs">
          {(['all', 'makanan', 'minuman', 'snack'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                selectedCategory === cat ? 'bg-amber-500 text-white font-bold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {cat === 'all' ? 'Semua' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setModalItem(item)}
            className="p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex gap-3 text-xs group"
          >
            {/* Thumbnail */}
            <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              {!item.isAvailable && (
                <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center font-bold text-white text-[10px]">
                  HABIS
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-1">
                  <h3 className="font-bold text-stone-900 text-sm group-hover:text-amber-700 transition-colors leading-tight">
                    {item.name}
                  </h3>
                  {item.isBestSeller && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold text-[9px] flex items-center gap-0.5 flex-shrink-0 shadow-xs">
                      <Sparkles className="w-2.5 h-2.5" /> Best
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-stone-500 font-medium mt-0.5 block">{item.tenantName}</span>
                <p className="text-stone-500 text-[11px] leading-relaxed line-clamp-2 mt-1">{item.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <span className="font-black text-amber-700 text-sm">{formatIDR(item.price)}</span>
                <span className="text-[10px] text-sky-600 group-hover:underline font-semibold flex items-center gap-1">
                  <span>Lihat Detail Opsi</span>
                  <Plus className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ProductDetailModal
        item={modalItem}
        onClose={() => setModalItem(null)}
        onAddToCart={(orderItem) => {
          if (onAddToCart) onAddToCart(orderItem);
          store.switchRoleDirectly('customer');
        }}
      />
    </div>
  );
};
