import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { getOrgConfig } from '@/lib/org-config';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://compassionglobal.org';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getOrgConfig();
  return {
    title: {
      default: config.siteName,
      template: `%s | ${config.siteName}`,
    },
    description: config.siteDescription,
    metadataBase: new URL(SITE_URL),
    openGraph: {
      siteName: config.siteName,
      locale: 'en_IN',
      type: 'website',
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
