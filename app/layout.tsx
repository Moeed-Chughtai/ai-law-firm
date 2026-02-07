import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LexForge — AI-Native Startup Law Firm',
  description: 'Automated legal review for startup financing documents. Upload your SAFE or Term Sheet for instant AI-powered analysis.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
