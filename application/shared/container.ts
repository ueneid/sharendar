import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

/**
 * DI コンテナの作成
 * Application層では抽象（Interface）のみを知る
 * 具体的な実装のバインドは外部（Infrastructure層）で行う
 */
export const createContainer = (): Container => {
  const container = new Container();
  return container;
};

// デフォルトコンテナインスタンス
export const container = createContainer();