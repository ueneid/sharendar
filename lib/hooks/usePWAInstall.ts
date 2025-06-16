'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  canShowPrompt: boolean;
  hasShownPrompt: boolean;
  visitCount: number;
  lastPromptDate: string | null;
}

interface UsePWAInstallReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  canShowPrompt: boolean;
  showInstallPrompt: () => Promise<boolean>;
  dismissPrompt: () => void;
  visitCount: number;
}

const STORAGE_KEY = 'pwa-install-state';
const MIN_VISITS_FOR_PROMPT = 3;
const DAYS_BETWEEN_PROMPTS = 7;

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    canShowPrompt: false,
    hasShownPrompt: false,
    visitCount: 0,
    lastPromptDate: null,
  });

  // ローカルストレージから状態を読み込み
  const loadState = useCallback((): PWAInstallState => {
    if (typeof window === 'undefined') return state;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...state, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('PWAインストール状態の読み込みに失敗:', error);
    }
    return state;
  }, [state]);

  // ローカルストレージに状態を保存
  const saveState = useCallback((newState: Partial<PWAInstallState>) => {
    if (typeof window === 'undefined') return;
    
    try {
      const currentState = loadState();
      const updatedState = { ...currentState, ...newState };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
      setState(updatedState);
    } catch (error) {
      console.warn('PWAインストール状態の保存に失敗:', error);
    }
  }, [loadState]);

  // 訪問回数を増加
  const incrementVisitCount = useCallback(() => {
    const currentState = loadState();
    const newVisitCount = currentState.visitCount + 1;
    saveState({ visitCount: newVisitCount });
  }, [loadState, saveState]);

  // プロンプト表示可能かチェック
  const checkCanShowPrompt = useCallback((currentState: PWAInstallState): boolean => {
    // 既にインストール済みの場合は表示しない
    if (currentState.isInstalled) return false;
    
    // インストール可能でない場合は表示しない
    if (!currentState.isInstallable) return false;
    
    // 最小訪問回数に達していない場合は表示しない
    if (currentState.visitCount < MIN_VISITS_FOR_PROMPT) return false;
    
    // 前回のプロンプト表示から指定日数経っていない場合は表示しない
    if (currentState.lastPromptDate) {
      const lastPromptTime = new Date(currentState.lastPromptDate).getTime();
      const now = Date.now();
      const daysSinceLastPrompt = (now - lastPromptTime) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastPrompt < DAYS_BETWEEN_PROMPTS) return false;
    }
    
    return true;
  }, []);

  // PWAがすでにインストールされているかチェック
  const checkIsInstalled = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    
    // standalone モードで実行されている場合はインストール済み
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    
    // iOS Safari の場合
    if ('standalone' in window.navigator && (window.navigator as any).standalone) return true;
    
    return false;
  }, []);

  // インストールプロンプトを表示
  const showInstallPrompt = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn('インストールプロンプトが利用できません');
      return false;
    }

    try {
      // プロンプトを表示
      await deferredPrompt.prompt();
      
      // ユーザーの選択を待つ
      const choiceResult = await deferredPrompt.userChoice;
      
      // 状態を更新
      saveState({
        hasShownPrompt: true,
        lastPromptDate: new Date().toISOString(),
      });
      
      // プロンプトを使用済みにする
      setDeferredPrompt(null);
      
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('インストールプロンプトの表示に失敗:', error);
      return false;
    }
  }, [deferredPrompt, saveState]);

  // プロンプトを却下
  const dismissPrompt = useCallback(() => {
    saveState({
      hasShownPrompt: true,
      lastPromptDate: new Date().toISOString(),
    });
  }, [saveState]);

  useEffect(() => {
    // 初期状態を読み込み
    const initialState = loadState();
    const isInstalled = checkIsInstalled();
    
    // 訪問回数を増加（インストール済みでない場合のみ）
    if (!isInstalled) {
      incrementVisitCount();
    }

    // beforeinstallprompt イベントのリスナーを設定
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const beforeInstallPromptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(beforeInstallPromptEvent);
      
      const currentState = { ...initialState, isInstallable: true, isInstalled };
      const canShow = checkCanShowPrompt(currentState);
      
      setState({
        ...currentState,
        canShowPrompt: canShow,
      });
      
      saveState({ isInstallable: true });
    };

    // appinstalled イベントのリスナーを設定
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      saveState({ isInstalled: true, isInstallable: false });
      setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
    };

    // イベントリスナーを追加
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 初期状態を設定
    const finalState = { ...initialState, isInstalled };
    setState({
      ...finalState,
      canShowPrompt: checkCanShowPrompt(finalState),
    });

    // クリーンアップ
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [loadState, saveState, incrementVisitCount, checkIsInstalled, checkCanShowPrompt]);

  return {
    isInstallable: state.isInstallable,
    isInstalled: state.isInstalled,
    canShowPrompt: state.canShowPrompt,
    showInstallPrompt,
    dismissPrompt,
    visitCount: state.visitCount,
  };
}