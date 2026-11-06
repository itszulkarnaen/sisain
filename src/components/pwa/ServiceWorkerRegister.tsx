'use client';

import { useEffect } from 'react';

export const ServiceWorkerRegister = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('NineToPay SW registered: ', registration.scope);
          })
          .catch((err) => {
            console.warn('NineToPay SW registration failed: ', err);
          });
      });
    }
  }, []);

  return null;
};

