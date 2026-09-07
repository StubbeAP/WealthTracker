'use client';

import { useState } from 'react';
import { usePrivacy } from '@/context/privacy-context';
import { ShieldCheck, Lock, User, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function PasscodeLockOverlay() {
  const { isLocked, hasAccount, username: currentUsername, login, registerAccount } = usePrivacy();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  if (!isLocked) return null;

  const isRegistering = !hasAccount || mode === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsPending(true);

    try {
      if (isRegistering) {
        if (!usernameInput.trim()) {
          setErrorMsg('Username is required.');
          setIsPending(false);
          return;
        }
        if (passwordInput.length < 8) {
          setErrorMsg('Password must be at least 8 characters.');
          setIsPending(false);
          return;
        }
        if (passwordInput !== confirmPasswordInput) {
          setErrorMsg('Passwords do not match.');
          setIsPending(false);
          return;
        }

        const res = await registerAccount(usernameInput.trim(), passwordInput);
        if (!res.success) {
          setErrorMsg(res.error || 'Registration failed.');
        }
      } else {
        const targetUser = usernameInput.trim() || currentUsername;
        const res = await login(targetUser, passwordInput);
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid credentials.');
        }
      }
    } catch {
      setErrorMsg('An authentication error occurred.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl px-4">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {isRegistering ? 'Setup Master Security Account' : 'Confidential Wealth Authentication'}
          </h2>
          <p className="text-xs text-slate-400">
            {isRegistering
              ? 'Create your username and strong master password to secure portfolio data'
              : 'Enter your username and password to unlock your confidential balances'}
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-800 text-xs flex items-center gap-2 animate-bounce">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login / Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder={hasAccount ? currentUsername : 'Enter username'}
                defaultValue={hasAccount ? currentUsername : ''}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Master Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-blue-600/30 hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {isPending
              ? 'Authenticating...'
              : isRegistering
              ? 'Create Master Account & Unlock'
              : 'Unlock Portfolio'}
          </button>
        </form>

        {hasAccount && (
          <div className="text-center pt-2 border-t border-slate-800/80">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrorMsg(null);
              }}
              className="text-xs text-blue-400 hover:underline"
            >
              {mode === 'login' ? 'Reset / Register New Account' : 'Back to Login'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChangePasscodeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { changePassword } = usePrivacy();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 8) {
      setStatus({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPass !== confirmPass) {
      setStatus({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    const res = await changePassword(currentPass, newPass);
    if (res.success) {
      setStatus({ type: 'success', text: 'Master password updated successfully!' });
      setTimeout(() => {
        onClose();
        setStatus(null);
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      }, 1500);
    } else {
      setStatus({ type: 'error', text: res.error || 'Failed to update password.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="glass-card max-w-sm w-full p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-blue-400" />
          Change Master Password
        </h3>

        {status && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              status.type === 'success'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{status.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">New Password (min 8 chars)</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors"
            >
              Save Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
