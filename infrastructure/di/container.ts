/**
 * DIコンテナの初期化
 * アプリケーション起動時に一度だけ実行
 */

import { container } from '@/application/shared/container';
import { configureContainer } from './bindings';

/**
 * DIコンテナを初期化する
 * Application層のcontainerにInfrastructure層の実装をバインド
 */
export const initializeContainer = (): void => {
  // Infrastructure層の具体的な実装をバインド
  configureContainer(container);
};

/**
 * 初期化済みのコンテナを取得
 */
export const getInitializedContainer = () => {
  return container;
};