import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Habit Tracker',
  description: 'Personal habit tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('unhandledrejection', function(e) {
            var stack = (e.reason && e.reason.stack) || '';
            var msg = (e.reason && e.reason.message) || '';
            if (stack.indexOf('chrome-extension://') !== -1 || msg.indexOf('MetaMask') !== -1) {
              e.preventDefault();
            }
          });
        `}} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
