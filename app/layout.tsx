import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LexForge — AI-Native Legal Review',
  description: 'Automated legal review for startup financing documents. Upload your SAFE or Term Sheet for comprehensive analysis.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-25 text-gray-900">
        {children}
      </body>
    </html>
  );
}
