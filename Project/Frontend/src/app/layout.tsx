import type { Metadata } from 'next';
import { Geist, Geist_Mono, Outfit, Poppins, Nunito_Sans } from 'next/font/google';
import { Providers } from '@/lib/providers';
import { ClientLayout } from '@/components/layout/ClientLayout';
import './globals.css';
import './auth.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
});

const nunitoSans = Nunito_Sans({
  variable: '--font-nunito-sans',
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'StudyPlan',
  description: 'AI-powered study planning assistant',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${poppins.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
