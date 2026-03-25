'use client';

import { useEffect } from 'react';

export default function SuppressExtensionErrors() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const stack = event.reason?.stack ?? '';
      const message = event.reason?.message ?? '';
      if (stack.includes('chrome-extension://') || message.includes('MetaMask')) {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  return null;
}
