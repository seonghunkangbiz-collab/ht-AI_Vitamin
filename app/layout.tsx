import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HT사업본부 AI Vitamin Program',
  description: 'Connecting People, Growing Together - HT사업본부 조직문화 모바일 웹',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0EA5E9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased min-h-screen bg-slate-100 flex justify-center items-start">
        {children}
      </body>
    </html>
  );
}
