import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CompassionGlobal',
  description: 'Empowering local communities for global change.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
