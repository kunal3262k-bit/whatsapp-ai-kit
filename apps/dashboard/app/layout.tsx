import type { Metadata, Viewport } from 'next';
import './globals.css';
import Nav from '../components/Nav';
import RegisterSw from './register-sw';

export const metadata: Metadata = {
  title: 'WhatsApp AI Kit',
  description: 'Sales + delivery cockpit for the WhatsApp AI lead-qualifier.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0d9488',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <RegisterSw />
        {children}
      </body>
    </html>
  );
}
