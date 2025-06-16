import { create } from 'zustand';
import { useOnlineStatus } from './useOnlineStatus';
import { useEffect, useCallback } from 'react';

/**
 * 同期待ちのアクション
 */
export interface PendingSyncAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'activity' | 'family-member';
  entityId?: string;
  data?: any;
  timestamp: Date;
  retryCount: number;
  error?: string;
}

/**
 * 同期ストアの状態
 */
interface SyncStore {
  // 同期待ちのアクション
  pendingActions: PendingSyncAction[];
  
  // 同期状態
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncError: string | null;
  
  // アクション
  addPendingAction: (action: Omit<PendingSyncAction, 'id' | 'retryCount' | 'timestamp'>) => void;
  removePendingAction: (id: string) => void;
  clearPendingActions: () => void;
  startSync: () => void;
  finishSync: (success: boolean, error?: string) => void;
  incrementRetryCount: (id: string) => void;
  
  // 計算値
  getPendingActionsCount: () => number;
  hasPendingActions: () => boolean;
  getFailedActions: () => PendingSyncAction[];
}

/**
 * 同期管理ストア
 */
export const useSyncStore = create<SyncStore>((set, get) => ({
  pendingActions: [],
  isSyncing: false,
  lastSyncAt: null,
  syncError: null,
  
  addPendingAction: (action) => {
    const newAction: PendingSyncAction = {
      ...action,
      id: `${action.type}-${action.entityType}-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      retryCount: 0,
    };
    
    set(state => ({
      pendingActions: [...state.pendingActions, newAction]
    }));
  },
  
  removePendingAction: (id) => {
    set(state => ({
      pendingActions: state.pendingActions.filter(action => action.id !== id)
    }));
  },
  
  clearPendingActions: () => {
    set({ pendingActions: [] });
  },
  
  startSync: () => {
    set({ isSyncing: true, syncError: null });
  },
  
  finishSync: (success, error) => {
    set({
      isSyncing: false,
      lastSyncAt: success ? new Date() : get().lastSyncAt,
      syncError: error || null,
    });
  },
  
  incrementRetryCount: (id) => {
    set(state => ({
      pendingActions: state.pendingActions.map(action =>
        action.id === id
          ? { ...action, retryCount: action.retryCount + 1 }
          : action
      )
    }));
  },
  
  getPendingActionsCount: () => {
    return get().pendingActions.length;
  },
  
  hasPendingActions: () => {
    return get().pendingActions.length > 0;
  },
  
  getFailedActions: () => {
    return get().pendingActions.filter(action => action.error);
  },
}));

/**
 * 同期状態を監視するカスタムフック
 */
export function useSyncStatus() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const syncStore = useSyncStore();
  
  const handleAutoSync = useCallback(async () => {
    if (syncStore.isSyncing || !isOnline) return;
    
    syncStore.startSync();
    
    try {
      // 実際の同期処理はここで実装
      // 現在はモック実装
      console.log('同期処理を開始:', syncStore.pendingActions);
      
      // 同期の成功をシミュレート
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      syncStore.clearPendingActions();
      syncStore.finishSync(true);
      
      console.log('同期が完了しました');
    } catch (error) {
      syncStore.finishSync(false, error instanceof Error ? error.message : '同期に失敗しました');
      console.error('同期エラー:', error);
    }
  }, [syncStore, isOnline]);

  // オンライン復帰時の自動同期
  useEffect(() => {
    const hasPendingActions = syncStore.hasPendingActions();
    if (isOnline && wasOffline && hasPendingActions) {
      // 簡単な遅延を追加して、ネットワークが安定してから同期を開始
      const timer = setTimeout(() => {
        handleAutoSync();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, syncStore, handleAutoSync]);
  
  return {
    ...syncStore,
    isOnline,
    canSync: isOnline && !syncStore.isSyncing,
    shouldShowSyncIndicator: !isOnline || syncStore.isSyncing || syncStore.hasPendingActions(),
  };
}