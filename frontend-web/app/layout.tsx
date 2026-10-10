import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'ShopSmart AI',
  description: 'Grounded AI-assisted commerce — Node.js + Next.js local MVP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="container">{children}</main>
          <footer className="footer">
            ShopSmart AI · Node.js + Express + Next.js local MVP · payments/carriers simulated
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
