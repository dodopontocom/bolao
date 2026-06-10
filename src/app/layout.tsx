import type { Metadata } from 'next';
import './globals.css';
import DevSimulator from '@/components/DevSimulator';

import { AppProvider } from '@/context/AppContext';

export const metadata: Metadata = {
  title: 'Bolão Copa 2026',
  description: 'Bolão da família para a Copa do Mundo 2026',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-[#050816]">
        <AppProvider>
          {children}
          <DevSimulator />
        </AppProvider>
      </body>
    </html>
  );
}
