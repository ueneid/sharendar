'use client';

import { useEffect, useRef } from 'react';
import { initializeContainer } from '@/infrastructure/di/container';

interface DIProviderProps {
  children: React.ReactNode;
}

export const DIProvider = ({ children }: DIProviderProps) => {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      // DIコンテナを初期化
      initializeContainer();
      initialized.current = true;
    }
  }, []);

  return <>{children}</>;
};