import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import { AppShell } from '../components/AppShell';

export const metadata: Metadata = {
  title: 'Colombo Stock Exchange (CSE) Demo Trading | Powered by Aravinda™',
  description: 'Practice trading Sri Lankan equities in real-time or off-hours with Rs. 1,000,000 virtual capital. Powered by Aravinda™ Automated Trading System.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-fintech-dark text-zinc-100 antialiased selection:bg-blue-600 selection:text-white">
        <AuthProvider>
          <SocketProvider>
            <AppShell>{children}</AppShell>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
