/**
 * DIコンテナの初期化
 * アプリケーション起動時に一度だけ実行
 */

import { container as appContainer } from '@/application/shared/container';
import { configureContainer } from './bindings';

// 初期化フラグ
let isInitialized = false;

/**
 * DIコンテナを初期化する
 * Application層のcontainerにInfrastructure層の実装をバインド
 */
export const initializeContainer = (): void => {
  if (isInitialized) return;
  
  // Infrastructure層の具体的な実装をバインド
  configureContainer(appContainer);
  isInitialized = true;
};

/**
 * 初期化済みのコンテナを取得
 */
export const getInitializedContainer = () => {
  // クライアントサイドで自動初期化
  if (typeof window !== 'undefined' && !isInitialized) {
    initializeContainer();
  }
  return appContainer;
};

// コンテナのエクスポート
export { appContainer as container };