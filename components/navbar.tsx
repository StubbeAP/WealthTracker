'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, LayoutDashboard, PlusCircle, Settings, Database, Lock, LogOut, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useState, useTransition } from 'react';
import { seedDemoDataAction } from '@/app/actions';
import { usePrivacy } from '@/context/privacy-context';
import { ChangePasscodeModal } from '@/components/auth/passcode-lock';

interface NavbarProps {
  netWorth?: number;
}

export function Navbar({ netWorth }: NavbarProps) {
  const pathname = usePathname();
  const { isPrivacyMode, togglePrivacyMode, lockApp, formatCurrency, username } = usePrivacy();
  const [isPending, startTransition] = useTransition();
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleSeed = () => {
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
    { href: '/assets', label: 'Assets & Platforms', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 glass-card border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-gradient tracking-tight">WealthTracker</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                {username ? `@${username}` : 'Encrypted'}
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {typeof netWorth === 'number' && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400">Total Portfolio:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatCurrency(netWorth)}
                </span>
              </div>
            )}

            {/* Privacy Mode Toggle */}
            <button
              onClick={togglePrivacyMode}
              title={isPrivacyMode ? 'Disable Privacy Masking' : 'Enable Privacy Masking'}
              className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                isPrivacyMode
                  ? 'bg-purple-950/80 text-purple-300 border-purple-700/60 shadow-lg shadow-purple-900/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Change Password */}
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              title="Change Password"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-all"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Seed Demo Button */}
            <button
              onClick={handleSeed}
              disabled={isPending}
              title="Seed 5-Year Historical Demo Data into Supabase"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-900/80 transition-all disabled:opacity-50"
            >
              <Database className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
              <span>Seed DB</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={lockApp}
              title="Logout / Lock Session"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/70 text-rose-200 border border-rose-800/80 hover:bg-rose-900 hover:text-white transition-all text-xs font-bold shadow-md shadow-rose-950/50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {seedMessage && (
          <div className="bg-indigo-950/90 text-indigo-200 border-b border-indigo-800 text-center py-1 text-xs font-medium animate-pulse">
            {seedMessage}
          </div>
        )}
      </header>

      <ChangePasscodeModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
    </>
  );
}
