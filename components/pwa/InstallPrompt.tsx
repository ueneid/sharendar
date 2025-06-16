'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/lib/hooks/usePWAInstall';

interface InstallPromptProps {
  /** プロンプト表示の追加条件（重要な操作後など） */
  triggerCondition?: boolean;
  /** カスタムメッセージ */
  customMessage?: string;
  /** プロンプトの位置 */
  position?: 'top' | 'bottom';
}

export default function InstallPrompt({ 
  triggerCondition = false, 
  customMessage,
  position = 'top' 
}: InstallPromptProps) {
  const { 
    canShowPrompt, 
    isInstalled, 
    showInstallPrompt, 
    dismissPrompt,
    visitCount 
  } = usePWAInstall();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // プロンプト表示条件をチェック
  useEffect(() => {
    const shouldShow = canShowPrompt && !isInstalled && (triggerCondition || visitCount >= 3);
    
    if (shouldShow && !isVisible) {
      // 少し遅延させてからアニメーション付きで表示
      setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 1000);
    }
  }, [canShowPrompt, isInstalled, triggerCondition, visitCount, isVisible]);

  // インストールボタンクリック処理
  const handleInstall = async () => {
    const success = await showInstallPrompt();
    if (success) {
      handleClose();
    }
  };

  // 閉じるボタンクリック処理
  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      dismissPrompt();
    }, 300);
  };

  // プロンプトが表示されない場合は何も表示しない
  if (!isVisible || isInstalled) {
    return null;
  }

  const defaultMessage = "家族の予定をいつでもすぐにチェック！Sharendarをホーム画面に追加して、より便利にご利用ください。";
  const message = customMessage || defaultMessage;

  return (
    <div
      className={`
        fixed left-4 right-4 z-50 transition-all duration-300 ease-in-out
        ${position === 'top' ? 'top-4' : 'bottom-20'}
        ${isAnimating ? 'translate-y-0 opacity-100' : position === 'top' ? '-translate-y-full opacity-0' : 'translate-y-full opacity-0'}
      `}
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-description"
    >
      <div className="bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg shadow-lg p-4 text-white relative overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white opacity-10 rounded-full translate-y-4 -translate-x-4"></div>
        
        <div className="relative">
          {/* 閉じるボタン */}
          <button 
            onClick={handleClose}
            className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
            aria-label="プロンプトを閉じる"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* アイコンとタイトル */}
          <div className="flex items-start space-x-3 mb-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="install-prompt-title" className="font-semibold text-sm mb-1">
                アプリをインストール
              </h3>
              <p id="install-prompt-description" className="text-sm text-white text-opacity-90 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={handleInstall}
              className="flex-1 bg-white text-sky-600 font-medium py-2 px-4 rounded-md text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              インストール
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-white text-opacity-80 hover:text-opacity-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-md"
            >
              後で
            </button>
          </div>

          {/* プログレスインジケーター（訪問回数ベース） */}
          <div className="mt-3 flex items-center space-x-1">
            <span className="text-xs text-white text-opacity-70">
              {visitCount}回目の訪問
            </span>
            <div className="flex-1 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden ml-2">
              <div 
                className="h-full bg-white bg-opacity-50 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((visitCount / 5) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}