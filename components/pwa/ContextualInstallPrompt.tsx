'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePWAInstall } from '@/lib/hooks/usePWAInstall';

interface UserAction {
  type: 'activity_created' | 'activity_completed' | 'calendar_viewed' | 'task_completed' | 'filter_used';
  timestamp: number;
  value?: string | number;
}

interface ContextualInstallPromptProps {
  /** トリガーとなるユーザー行動 */
  trigger: UserAction;
  /** 表示するメッセージのカスタマイズ */
  contextMessage?: string;
  /** 遅延時間（ミリ秒） */
  delay?: number;
}

const STORAGE_KEY = 'user-actions-log';
const MAX_LOG_ENTRIES = 100;

// コンテキストに応じたメッセージを生成
function getContextualMessage(actions: UserAction[]): string {
  const recentActions = actions.slice(-10);
  const actionCounts = recentActions.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 最も多いアクションタイプに基づいてメッセージを決定
  const dominantAction = Object.entries(actionCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  switch (dominantAction) {
    case 'activity_created':
      return "新しい予定をよく追加されていますね！アプリをインストールすれば、いつでもサッと予定を追加できます。";
    case 'task_completed':
      return "タスクの完了お疲れ様です！アプリをホーム画面に追加して、家族のタスク管理をより便利にしませんか？";
    case 'calendar_viewed':
      return "カレンダーをよくチェックされていますね！アプリをインストールして、家族の予定をいつでも確認できるようにしませんか？";
    case 'filter_used':
      return "絞り込み機能を活用されていますね！アプリをインストールして、より効率的に予定管理を行いませんか？";
    default:
      return "Sharendarを気に入っていただけたようですね！アプリをインストールして、家族の予定共有をより便利にしませんか？";
  }
}

// ユーザー行動のスコア計算
function calculateEngagementScore(actions: UserAction[]): number {
  const now = Date.now();
  const last24Hours = now - (24 * 60 * 60 * 1000);
  const recentActions = actions.filter(action => action.timestamp > last24Hours);

  // 行動タイプ別の重み
  const weights = {
    'activity_created': 10,
    'activity_completed': 8,
    'task_completed': 8,
    'calendar_viewed': 3,
    'filter_used': 5,
  };

  return recentActions.reduce((score, action) => {
    return score + (weights[action.type] || 1);
  }, 0);
}

export default function ContextualInstallPrompt({ 
  trigger, 
  contextMessage, 
  delay = 2000 
}: ContextualInstallPromptProps) {
  const { canShowPrompt, isInstalled, showInstallPrompt, dismissPrompt } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [userActions, setUserActions] = useState<UserAction[]>([]);
  const [message, setMessage] = useState('');

  // ユーザー行動ログを読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const actions = JSON.parse(stored) as UserAction[];
        setUserActions(actions);
      }
    } catch (error) {
      console.warn('ユーザー行動ログの読み込みに失敗:', error);
    }
  }, []);

  // ユーザー行動を記録
  const logUserAction = useCallback((action: UserAction) => {
    try {
      setUserActions(prevActions => {
        const updatedActions = [...prevActions, action].slice(-MAX_LOG_ENTRIES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedActions));
        return updatedActions;
      });
    } catch (error) {
      console.warn('ユーザー行動ログの保存に失敗:', error);
    }
  }, []);

  // トリガー行動を記録し、プロンプト表示を検討
  useEffect(() => {
    if (isInstalled || !trigger) return;

    // 行動を記録
    logUserAction(trigger);

    // エンゲージメントスコアを計算
    const engagementScore = calculateEngagementScore([...userActions, trigger]);
    
    // 高エンゲージメント（30点以上）でプロンプト表示を検討
    if (engagementScore >= 30 && canShowPrompt) {
      // コンテキストメッセージを生成
      const contextualMessage = contextMessage || getContextualMessage([...userActions, trigger]);
      setMessage(contextualMessage);

      // 遅延後に表示
      setTimeout(() => {
        setIsVisible(true);
      }, delay);
    }
  }, [trigger, canShowPrompt, isInstalled, contextMessage, delay, userActions, logUserAction]);

  // インストール処理
  const handleInstall = async () => {
    const success = await showInstallPrompt();
    if (success) {
      setIsVisible(false);
    }
  };

  // 閉じる処理
  const handleClose = () => {
    setIsVisible(false);
    dismissPrompt();
  };

  if (!isVisible || isInstalled || !canShowPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        {/* アイコン */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            アプリをインストール
          </h3>
        </div>

        {/* メッセージ */}
        <p className="text-gray-600 text-center leading-relaxed mb-6">
          {message}
        </p>

        {/* 利便性の説明 */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
            <span>ホーム画面からワンタップでアクセス</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
            <span>オフラインでも予定の確認が可能</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
            <span>より高速な読み込み</span>
          </div>
        </div>

        {/* ボタン */}
        <div className="space-y-3">
          <button
            onClick={handleInstall}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white font-medium py-3 px-4 rounded-lg hover:from-sky-600 hover:to-blue-600 transition-all duration-200 shadow-md"
          >
            今すぐインストール
          </button>
          <button
            onClick={handleClose}
            className="w-full text-gray-500 text-sm py-2 hover:text-gray-700 transition-colors"
          >
            後で通知する
          </button>
        </div>
      </div>
    </div>
  );
}

// ユーザー行動追跡用のヘルパー関数
export function trackUserAction(type: UserAction['type'], value?: string | number) {
  const action: UserAction = {
    type,
    timestamp: Date.now(),
    ...(value !== undefined && { value }),
  };

  // カスタムイベントを発火して、コンポーネントにトリガーを通知
  window.dispatchEvent(new CustomEvent('user-action', { detail: action }));
}