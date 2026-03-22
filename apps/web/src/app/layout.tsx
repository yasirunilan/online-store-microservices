import type { Metadata } from 'next';
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
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
