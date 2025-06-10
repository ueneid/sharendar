'use client';

import { useEffect, useRef } from 'react';
import { initializeContainer } from '@/infrastructure/di/container';
import { db } from '@/infrastructure/db/schema';

interface DIProviderProps {
  children: React.ReactNode;
}

export const DIProvider = ({ children }: DIProviderProps) => {
  const initialized = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (!initialized.current) {
        try {
          // DIコンテナを初期化
          initializeContainer();
          
          // データベースを初期化
          await db.initialize();
          
          initialized.current = true;
          console.log('DI Container and Database initialized');
        } catch (error) {
          console.error('Initialization failed:', error);
        }
      }
    };
    
    init();
  }, []);

  return <>{children}</>;
};