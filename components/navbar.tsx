'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, LayoutDashboard, PlusCircle, Settings, Database, Lock, LogOut, Eye, EyeOff, KeyRound, Smartphone, ChevronDown, User, ShieldCheck } from 'lucide-react';
import { useState, useTransition, useRef, useEffect } from 'react';
import { seedDemoDataAction } from '@/app/actions';
import { usePrivacy } from '@/context/privacy-context';
import { ChangePasscodeModal, Setup2FAModal } from '@/components/auth/passcode-lock';

interface NavbarProps {
  netWorth?: number;
}

export function Navbar({ netWorth }: NavbarProps) {
  const pathname = usePathname();
  const { isPrivacyMode, togglePrivacyMode, lockApp, formatCurrency, username, is2FAEnabled } = usePrivacy();
  const [isPending, startTransition] = useTransition();
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSeed = () => {
    setIsUserMenuOpen(false);
    setSeedMessage('Seeding 5-year demo history...');
    startTransition(async () => {
      const res = await seedDemoDataAction();
      if (res.success) {
        setSeedMessage('Database seeded successfully!');
        setTimeout(() => setSeedMessage(null), 3000);
      } else {
        setSeedMessage(res.error || 'Seeding failed');
        setTimeout(() => setSeedMessage(null), 4000);
      }
    });
  };

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/snapshots', label: 'Bulk Snapshots', icon: PlusCircle },
    { href: '/assets', label: 'Assets & Liabilities', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 glass-card border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Brand */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-gradient tracking-tight">WealthTracker</span>
            </div>
          </Link>

          {/* Center: Clean Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-inner'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Net Worth Pill + Privacy Eye + Unified User Menu */}
          <div className="flex items-center gap-3">
            {typeof netWorth === 'number' && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400">Net Worth:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatCurrency(netWorth)}
                </span>
              </div>
            )}

            {/* Privacy Mode Toggle */}
            <button
              onClick={togglePrivacyMode}
              title={isPrivacyMode ? 'Disable Privacy Masking' : 'Enable Privacy Masking'}
              className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                isPrivacyMode
                  ? 'bg-purple-950/80 text-purple-300 border-purple-700/60 shadow-lg shadow-purple-900/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Unified User & Security Settings Menu Tab */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden md:inline text-slate-200 font-mono">@{username || 'user'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-card border border-slate-800 shadow-2xl py-2 text-xs z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      @{username}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Encrypted Session
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIs2FASetupOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-800/80 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-indigo-400" />
                        2FA Authenticator
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${is2FAEnabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-500'}`}>
                        {is2FAEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsChangePasswordOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-800/80 flex items-center gap-2"
                    >
                      <KeyRound className="w-4 h-4 text-cyan-400" />
                      Change Master Password
                    </button>

                    <button
                      onClick={handleSeed}
                      disabled={isPending}
                      className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-800/80 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Database className={`w-4 h-4 text-purple-400 ${isPending ? 'animate-spin' : ''}`} />
                      Seed 5-Year Demo DB
                    </button>
                  </div>

                  <div className="border-t border-slate-800 pt-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        lockApp();
                      }}
                      className="w-full px-4 py-2 text-left text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 font-bold"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      Logout / Lock Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {seedMessage && (
          <div className="bg-indigo-950/90 text-indigo-200 border-b border-indigo-800 text-center py-1 text-xs font-medium animate-pulse">
            {seedMessage}
          </div>
        )}
      </header>

      <ChangePasscodeModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
      <Setup2FAModal isOpen={is2FASetupOpen} onClose={() => setIs2FASetupOpen(false)} />
    </>
  );
}
