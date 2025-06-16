'use client';

import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useState, useEffect } from 'react';

interface NetworkStatusProps {
  /** 接続復帰時の自動非表示時間（ミリ秒） */
  autoHideDuration?: number;
  /** 常に表示するかどうか */
  alwaysShow?: boolean;
}

/**
 * ネットワーク接続状態を表示するコンポーネント
 * オフライン時は常に表示、オンライン復帰時は一定時間後に自動で非表示
 */
export function NetworkStatus({ 
  autoHideDuration = 3000,
  alwaysShow = false 
}: NetworkStatusProps) {
  const { isOnline, wasOffline, lastOnlineAt } = useOnlineStatus();
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // クライアントサイドでのみマウント
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // オフライン状態から復帰した場合のみ、一時的に復帰メッセージを表示
    if (isOnline && wasOffline && lastOnlineAt) {
      setShowOnlineMessage(true);
      
      const timer = setTimeout(() => {
        setShowOnlineMessage(false);
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, lastOnlineAt, autoHideDuration]);

  // 常に表示する場合、または、オフライン時、または、復帰メッセージ表示中の場合に表示
  const shouldShow = alwaysShow || !isOnline || showOnlineMessage;

  if (!isMounted || !shouldShow) {
    return null;
  }

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all duration-300
        ${isOnline 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white animate-pulse'
        }
      `}
      role="alert"
      aria-live="polite"
    >
      {isOnline ? (
        <div className="flex items-center justify-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          オンライン - 同期が利用可能です
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          オフライン - データは端末に保存されます
        </div>
      )}
    </div>
  );
}

/**
 * コンパクトなネットワーク状態インジケーター
 * ナビゲーションバーなどに組み込み用
 */
export function NetworkIndicator() {
  const { isOnline } = useOnlineStatus();
  const [isMounted, setIsMounted] = useState(false);
  
  // クライアントサイドでのみマウント
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={`
        w-2 h-2 rounded-full transition-colors duration-300
        ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}
      `}
      title={isOnline ? 'オンライン' : 'オフライン'}
      aria-label={isOnline ? 'オンライン' : 'オフライン'}
    />
  );
}