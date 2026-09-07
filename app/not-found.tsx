import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-background text-slate-100">
      <h2 className="text-2xl font-bold text-white">404 - Page Not Found</h2>
      <p className="text-sm text-slate-400 mt-2">The page you are looking for does not exist.</p>
      <Link href="/" className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500 transition-colors">
        Return to Dashboard
      </Link>
    </div>
  );
}
