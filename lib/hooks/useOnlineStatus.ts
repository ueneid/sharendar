import { useEffect, useState } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
  lastOfflineAt: Date | null;
}

/**
 * ネットワーク接続状態を監視するカスタムフック
 * 
 * @returns オンライン状態の詳細情報
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);
  const [lastOfflineAt, setLastOfflineAt] = useState<Date | null>(null);

  useEffect(() => {
    // 初期状態でオンラインの場合は記録
    if (isOnline && lastOnlineAt === null) {
      setLastOnlineAt(new Date());
    }

    const handleOnline = () => {
      const now = new Date();
      setIsOnline(true);
      setLastOnlineAt(now);
      
      // オフライン状態から復帰した場合
      if (wasOffline) {
        console.log('ネットワーク接続が復帰しました', now);
      }
    };

    const handleOffline = () => {
      const now = new Date();
      setIsOnline(false);
      setWasOffline(true);
      setLastOfflineAt(now);
      console.log('ネットワーク接続が切断されました', now);
    };

    // イベントリスナーの登録
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // クリーンアップ
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline, wasOffline, lastOnlineAt]);

  return {
    isOnline,
    wasOffline,
    lastOnlineAt,
    lastOfflineAt,
  };
}

/**
 * シンプルなオンライン状態のみを返すフック
 */
export function useIsOnline(): boolean {
  const { isOnline } = useOnlineStatus();
  return isOnline;
}