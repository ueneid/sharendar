'use client';

import { useEffect } from 'react';
import { useFamilyMemberStore, useFamilyMemberAsync } from '@/lib/store';
import { MemberList } from './components/MemberList';
import { MemberForm } from './components/MemberForm';
import MobileLayout from '@/components/layout/MobileLayout';

export default function SettingsPage() {
  const { loadMembers } = useFamilyMemberStore();
  const { loading, error } = useFamilyMemberAsync();

  // ページ読み込み時にメンバーを取得
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  return (
    <MobileLayout title="設定">
      <div className="px-4 py-6 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {/* ローディング状態 */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">読み込み中...</span>
            </div>
          )}

          {/* エラー状態 */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="font-medium text-red-800 mb-1">エラーが発生しました</h3>
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={loadMembers}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                再試行
              </button>
            </div>
          )}

          {/* メンバー管理セクション */}
          {!loading && (
            <div className="space-y-6">
              <MemberList />
            </div>
          )}

          {/* 今後の機能セクション */}
          <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">今後の機能</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                  📊
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">データエクスポート</h3>
                  <p className="text-sm text-gray-600">
                    家族の予定やタスクをバックアップ・共有
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                  🔔
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">通知設定</h3>
                  <p className="text-sm text-gray-600">
                    予定やタスクのリマインダー設定
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                  🎨
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">テーマ設定</h3>
                  <p className="text-sm text-gray-600">
                    ダークモードやカスタムテーマ
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                  📱
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">PWA設定</h3>
                  <p className="text-sm text-gray-600">
                    ホーム画面への追加とオフライン設定
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* モーダル */}
      <MemberForm />
    </MobileLayout>
  );
}