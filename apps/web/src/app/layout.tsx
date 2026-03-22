import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/toast';
import { Nav } from '@/components/nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Online Store',
  description: 'A minimal online store',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ToastProvider>
          <Nav />
          <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
