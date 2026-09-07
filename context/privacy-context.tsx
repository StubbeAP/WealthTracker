'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authenticateUserAction, registerUserAction, changePasswordAction } from '@/app/actions';

interface PrivacyContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  isLocked: boolean;
  hasAccount: boolean;
  username: string;
  lockApp: () => void;
  login: (user: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerAccount: (user: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  formatCurrency: (amount: number | null | undefined, forceDigits?: number) => string;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'wt_auth_username';
const HASH_STORAGE_KEY = 'wt_auth_pass_hash';
const PRIVACY_STORAGE_KEY = 'wt_privacy_mode';

export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password + '_wealth_tracker_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('admin');
  const [hasAccount, setHasAccount] = useState<boolean>(true);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const storedHash = localStorage.getItem(HASH_STORAGE_KEY);

    if (storedUser) {
      setUsername(storedUser);
    }
    if (storedUser || storedHash) {
      setHasAccount(true);
    }

    const storedPrivacy = localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (storedPrivacy === 'true') {
      setIsPrivacyMode(true);
    }
  }, []);

  // Inactivity Auto-Lock Timer (5 Minutes)
  useEffect(() => {
    if (isLocked) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsLocked(true);
      }, 5 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [isLocked]);

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem(PRIVACY_STORAGE_KEY, String(next));
      return next;
    });
  };

  const lockApp = useCallback(() => {
    setIsLocked(true);
  }, []);

  const registerAccount = useCallback(async (user: string, pass: string) => {
    if (pass.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    const passHash = await hashPassword(pass);

    // 1. Save to Supabase wt_users
    const dbRes = await registerUserAction(user, passHash);
    if (!dbRes.success) {
      return dbRes;
    }

    // 2. Cache locally
    setUsername(user);
    setHasAccount(true);
    setIsLocked(false);

    localStorage.setItem(USER_STORAGE_KEY, user);
    localStorage.setItem(HASH_STORAGE_KEY, passHash);

    return { success: true };
  }, []);

  const login = useCallback(
    async (user: string, pass: string) => {
      if (lockoutTime && Date.now() < lockoutTime) {
        const remainingSeconds = Math.ceil((lockoutTime - Date.now()) / 1000);
        return {
          success: false,
          error: `Too many failed attempts. Account locked for ${remainingSeconds}s.`,
        };
      }

      const inputHash = await hashPassword(pass);

      // Authenticate against Supabase wt_users
      const res = await authenticateUserAction(user, inputHash);

      if (res.success) {
        setUsername(user);
        setIsLocked(false);
        setFailedAttempts(0);
        setLockoutTime(null);

        localStorage.setItem(USER_STORAGE_KEY, user);
        localStorage.setItem(HASH_STORAGE_KEY, inputHash);
        return { success: true };
      }

      // Check local fallback hash if Supabase user table hasn't been created yet
      const localHash = localStorage.getItem(HASH_STORAGE_KEY);
      const localUser = localStorage.getItem(USER_STORAGE_KEY);
      if (localHash && localHash === inputHash && localUser?.toLowerCase() === user.toLowerCase()) {
        setUsername(user);
        setIsLocked(false);
        setFailedAttempts(0);
        setLockoutTime(null);
        return { success: true };
      }

      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 5) {
        const lockUntil = Date.now() + 60 * 1000;
        setLockoutTime(lockUntil);
        return {
          success: false,
          error: 'Too many invalid attempts. Account locked for 60 seconds.',
        };
      }

      return {
        success: false,
        error: res.error || `Invalid credentials. (${5 - newAttempts} attempts remaining)`,
      };
    },
    [failedAttempts, lockoutTime]
  );

  const changePassword = useCallback(
    async (currentPass: string, newPass: string) => {
      if (newPass.length < 8) {
        return { success: false, error: 'New password must be at least 8 characters long.' };
      }

      const currentHash = await hashPassword(currentPass);
      const newHash = await hashPassword(newPass);

      const res = await changePasswordAction(username, currentHash, newHash);
      if (res.success) {
        localStorage.setItem(HASH_STORAGE_KEY, newHash);
        return { success: true };
      }

      // Fallback local update
      const localHash = localStorage.getItem(HASH_STORAGE_KEY);
      if (localHash === currentHash) {
        localStorage.setItem(HASH_STORAGE_KEY, newHash);
        return { success: true };
      }

      return res;
    },
    [username]
  );

  const formatCurrency = useCallback(
    (amount: number | null | undefined, forceDigits: number = 2): string => {
      if (amount === null || amount === undefined) return '—';
      if (isPrivacyMode) return '$ •••,•••';
      return `$${amount.toLocaleString('en-US', {
        minimumFractionDigits: forceDigits,
        maximumFractionDigits: forceDigits,
      })}`;
    },
    [isPrivacyMode]
  );

  return (
    <PrivacyContext.Provider
      value={{
        isPrivacyMode,
        togglePrivacyMode,
        isLocked,
        hasAccount,
        username,
        lockApp,
        login,
        registerAccount,
        changePassword,
        formatCurrency,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};
