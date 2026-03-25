import type { Metadata } from 'next';
import SuppressExtensionErrors from '@/components/SuppressExtensionErrors';
import './globals.css';

export const metadata: Metadata = {
  title: 'Habit Tracker',
  description: 'Personal habit tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
          <SuppressExtensionErrors />
          {children}
        </body>
    </html>
  );
}
