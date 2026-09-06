import React, { useState, useEffect } from 'react';
import { Building2, ChefHat, CreditCard, Eye, EyeOff, KeyRound, Lock, ShieldCheck, User } from 'lucide-react';
import { Role } from '../types';
import { store } from '../services/store';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: Role;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, targetRole }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'admin' | 'kasir' | 'tenant'>('kasir');

  const tenants = store.getTenants();

  useEffect(() => {
    if (targetRole && targetRole !== 'customer') {
      setActiveTab(targetRole);
    }
  }, [targetRole]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = store.login(username, password);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message || 'Username atau password tidak sesuai.');
    }
  };

  const handlePresetSelect = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl text-stone-800 relative">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 text-xs"
        >
          ✕
        </button>

        <div className="text-center mb-4">
          <div className="w-10 h-10 mx-auto rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-2">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-stone-900">Login Pegawai & Tenant</h2>
          <p className="text-xs text-stone-500">Pilih role dan masukkan username & password</p>
        </div>

        {/* Role Preset Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 mb-4 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('kasir');
              handlePresetSelect('kasir1', 'kasir123');
            }}
            className={`py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'kasir' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <CreditCard className="w-3 h-3" />
            <span>Kasir</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('tenant');
              handlePresetSelect('soto', 'soto123');
            }}
            className={`py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'tenant' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <ChefHat className="w-3 h-3" />
            <span>Tenant</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              handlePresetSelect('admin', 'admin123');
            }}
            className={`py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>Admin</span>
          </button>
        </div>

        {/* Tenant Quick Buttons if activeTab === 'tenant' */}
        {activeTab === 'tenant' && (
          <div className="mb-3">
            <label className="text-[10px] text-stone-500 font-semibold block mb-1">Pilih Booth Tenant:</label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {tenants.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handlePresetSelect(t.username, t.password)}
                  className={`p-1.5 rounded-lg text-left border transition-all text-[11px] truncate ${
                    username === t.username
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <span className="mr-1">{t.logo}</span>
                  <span>{t.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-2 mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3 text-xs">
          <div>
            <label className="block text-stone-600 text-[11px] mb-1 font-medium">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-stone-400">
                <User className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-3 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 text-[11px] mb-1 font-medium">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-stone-400">
                <KeyRound className="w-3.5 h-3.5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-8 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-stone-400 hover:text-stone-700"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs text-xs transition-all active:scale-[0.98] mt-2"
          >
            Masuk ke Sistem
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                store.switchRoleDirectly('customer');
                onClose();
              }}
              className="text-[11px] text-sky-600 hover:underline font-medium"
            >
              Atau masuk sebagai Tamu Pelanggan (Tanpa Password)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
