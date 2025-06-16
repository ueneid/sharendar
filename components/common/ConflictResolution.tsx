'use client';

import { useState } from 'react';
import type { Activity } from '@/domain/activity/types';

/**
 * データ競合情報
 */
export interface DataConflict {
  id: string;
  entityType: 'activity' | 'family-member';
  conflictType: 'update' | 'delete';
  localVersion: any;
  remoteVersion: any;
  lastModified: {
    local: Date;
    remote: Date;
  };
}

interface ConflictResolutionProps {
  conflicts: DataConflict[];
  onResolve: (resolutions: Record<string, 'local' | 'remote' | 'merge'>) => void;
  onCancel: () => void;
}

/**
 * データ競合解決ダイアログ
 */
export function ConflictResolution({ conflicts, onResolve, onCancel }: ConflictResolutionProps) {
  const [resolutions, setResolutions] = useState<Record<string, 'local' | 'remote' | 'merge'>>({});
  
  const handleResolutionChange = (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    setResolutions(prev => ({
      ...prev,
      [conflictId]: resolution
    }));
  };
  
  const handleResolveAll = (resolution: 'local' | 'remote') => {
    const allResolutions: Record<string, 'local' | 'remote' | 'merge'> = {};
    conflicts.forEach(conflict => {
      allResolutions[conflict.id] = resolution;
    });
    setResolutions(allResolutions);
  };
  
  const handleSubmit = () => {
    onResolve(resolutions);
  };
  
  const isAllResolved = conflicts.every(conflict => resolutions[conflict.id]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            データ競合の解決が必要です
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {conflicts.length}件の競合が検出されました。各項目について、どちらのバージョンを保持するか選択してください。
          </p>
        </div>
        
        <div className="p-6">
          {/* 一括選択ボタン */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => handleResolveAll('local')}
              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              すべてローカル版を採用
            </button>
            <button
              onClick={() => handleResolveAll('remote')}
              className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              すべてサーバー版を採用
            </button>
          </div>
          
          {/* 競合一覧 */}
          <div className="space-y-6">
            {conflicts.map((conflict) => (
              <ConflictItem
                key={conflict.id}
                conflict={conflict}
                resolution={resolutions[conflict.id]}
                onResolutionChange={(resolution) => handleResolutionChange(conflict.id, resolution)}
              />
            ))}
          </div>
        </div>
        
        {/* アクションボタン */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isAllResolved}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            競合を解決（{Object.keys(resolutions).length}/{conflicts.length}）
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConflictItemProps {
  conflict: DataConflict;
  resolution?: 'local' | 'remote' | 'merge';
  onResolutionChange: (resolution: 'local' | 'remote' | 'merge') => void;
}

function ConflictItem({ conflict, resolution, onResolutionChange }: ConflictItemProps) {
  const getDisplayName = (entity: any) => {
    if (conflict.entityType === 'activity') {
      return entity.title || '無題のアクティビティ';
    }
    return entity.name || '無名のメンバー';
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="mb-4">
        <h3 className="font-medium text-gray-800">
          {getDisplayName(conflict.localVersion)} の競合
        </h3>
        <p className="text-sm text-gray-600">
          {conflict.conflictType === 'update' ? '更新' : '削除'}の競合が発生しました
        </p>
      </div>
      
      {/* 選択肢 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* ローカル版 */}
        <div className={`border rounded-lg p-3 cursor-pointer ${
          resolution === 'local' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        }`} onClick={() => onResolutionChange('local')}>
          <div className="flex items-center mb-2">
            <input
              type="radio"
              checked={resolution === 'local'}
              onChange={() => onResolutionChange('local')}
              className="mr-2"
            />
            <span className="font-medium text-blue-700">ローカル版を採用</span>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            最終更新: {formatDate(conflict.lastModified.local)}
          </div>
          <div className="text-sm">
            <ActivityPreview entity={conflict.localVersion} />
          </div>
        </div>
        
        {/* サーバー版 */}
        <div className={`border rounded-lg p-3 cursor-pointer ${
          resolution === 'remote' ? 'border-green-500 bg-green-50' : 'border-gray-200'
        }`} onClick={() => onResolutionChange('remote')}>
          <div className="flex items-center mb-2">
            <input
              type="radio"
              checked={resolution === 'remote'}
              onChange={() => onResolutionChange('remote')}
              className="mr-2"
            />
            <span className="font-medium text-green-700">サーバー版を採用</span>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            最終更新: {formatDate(conflict.lastModified.remote)}
          </div>
          <div className="text-sm">
            <ActivityPreview entity={conflict.remoteVersion} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityPreview({ entity }: { entity: any }) {
  if (!entity) {
    return <div className="text-gray-400 italic">削除済み</div>;
  }
  
  return (
    <div className="space-y-1">
      <div><strong>タイトル:</strong> {entity.title || entity.name}</div>
      {entity.description && (
        <div><strong>説明:</strong> {entity.description}</div>
      )}
      {entity.category && (
        <div><strong>カテゴリ:</strong> {entity.category}</div>
      )}
      {entity.status && (
        <div><strong>ステータス:</strong> {entity.status}</div>
      )}
    </div>
  );
}