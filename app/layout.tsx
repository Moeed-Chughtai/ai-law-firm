import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LexForge — Intelligent Legal Analysis',
  description: 'Automated legal review for startup financing documents. Upload your SAFE or Term Sheet for instant analysis.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 selection:bg-accent-200 selection:text-accent-900">
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 mix-blend-multiply pointer-events-none"></div>
        {children}
      </body>
    </html>
  );
}
