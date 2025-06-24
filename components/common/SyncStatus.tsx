'use client';

import { useSyncStatus } from '@/lib/hooks/useSyncStatus';
import { useState, useEffect } from 'react';

interface SyncStatusProps {
  /** コンパクト表示（ナビゲーション用） */
  compact?: boolean;
}

/**
 * 同期状態を表示するコンポーネント
 */
export function SyncStatus({ compact = false }: SyncStatusProps) {
  const {
    pendingActions,
    isSyncing,
    lastSyncAt,
    syncError,
    isOnline,
    getPendingActionsCount,
    shouldShowSyncIndicator,
  } = useSyncStatus();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // クライアントサイドでのみマウント
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // SSR時は常に非表示状態でレンダリング
  const shouldShow = isMounted && shouldShowSyncIndicator;
  const showContent = isMounted && shouldShowSyncIndicator;
  
  const pendingCount = getPendingActionsCount();
  
  const getSyncStatusText = () => {
    if (!isOnline) {
      return `オフライン - ${pendingCount}件の変更が同期待ち`;
    }
    
    if (isSyncing) {
      return `同期中... (${pendingCount}件)`;
    }
    
    if (syncError) {
      return `同期エラー - ${pendingCount}件の変更が同期待ち`;
    }
    
    if (pendingCount > 0) {
      return `${pendingCount}件の変更が同期待ち`;
    }
    
    if (lastSyncAt) {
      const timeAgo = getTimeAgo(lastSyncAt);
      return `最終同期: ${timeAgo}`;
    }
    
    return '同期済み';
  };
  
  const getSyncIcon = () => {
    if (!isOnline) {
      return (
        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }
    
    if (isSyncing) {
      return (
        <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    
    if (syncError) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    if (pendingCount > 0) {
      return (
        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  };
  
  if (compact) {
    return (
      <div 
        className={`flex items-center gap-1 text-xs cursor-pointer transition-opacity ${showContent ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsExpanded(!isExpanded)}
        title={isMounted ? getSyncStatusText() : ''}
      >
        {showContent && (
          <>
            {getSyncIcon()}
            {pendingCount > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full px-1 min-w-4 text-center">
                {pendingCount}
              </span>
            )}
          </>
        )}
      </div>
    );
  }
  
  return (
    <div className={`bg-gray-50 border-l-4 border-blue-400 p-3 transition-opacity ${shouldShow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {showContent && (
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {getSyncIcon()}
          <span className="text-sm font-medium text-gray-700">
            {getSyncStatusText()}
          </span>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
      
      {showContent && isExpanded && pendingActions.length > 0 && (
        <div className="mt-3 pl-6">
          <h4 className="text-sm font-medium text-gray-600 mb-2">同期待ちの変更:</h4>
          <div className="space-y-1">
            {pendingActions.slice(0, 5).map((action) => (
              <div key={action.id} className="text-xs text-gray-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                <span>
                  {action.type === 'create' && '作成'}
                  {action.type === 'update' && '更新'}
                  {action.type === 'delete' && '削除'}
                </span>
                <span>({action.entityType})</span>
                {action.error && (
                  <span className="text-red-500" title={action.error}>
                    ⚠️
                  </span>
                )}
              </div>
            ))}
            {pendingActions.length > 5 && (
              <div className="text-xs text-gray-400">
                その他 {pendingActions.length - 5} 件...
              </div>
            )}
          </div>
        </div>
      )}
      
      {showContent && syncError && isExpanded && (
        <div className="mt-2 pl-6">
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            エラー: {syncError}
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}時間前`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}日前`;
}