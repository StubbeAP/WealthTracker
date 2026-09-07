import type { Metadata } from 'next';
import './globals.css';
import { PrivacyProvider } from '@/context/privacy-context';
import { PasscodeLockOverlay } from '@/components/auth/passcode-lock';

export const metadata: Metadata = {
  title: 'WealthTracker | Confidential Personal Wealth & Portfolio Engine',
  description: 'Track portfolio balances and point-in-time value snapshots across platforms and asset classes with confidential security and rolling growth calculations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
        <PrivacyProvider>
          <PasscodeLockOverlay />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>WealthTracker © {new Date().getFullYear()} • Confidential Financial Intelligence</span>
              <span className="font-mono text-slate-600">Encrypted Session & RLS Protected</span>
            </div>
          </footer>
        </PrivacyProvider>
      </body>
    </html>
  );
}
