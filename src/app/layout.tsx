import type { Metadata } from 'next';
import './globals.css';

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
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
