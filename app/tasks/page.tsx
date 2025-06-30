'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Filter as FilterIcon, AlertCircle, CheckSquare } from 'lucide-react';
import { useActivityStore } from '@/lib/store/activity-store';
import { useFamilyMemberStore } from '@/lib/store';
import { ActivityCard } from '@/components/activity/ActivityCard';
import { TaskFilter } from './components/TaskFilter';
import MobileLayout from '@/components/layout/MobileLayout';
import type { Activity } from '@/domain/activity/types';

export default function TasksPage() {
  const { 
    loadAllActivities, 
    activities, 
    getFilteredActivities, 
    isLoading, 
    error,
    setShowEditForm,
    setEditingActivity
  } = useActivityStore();
  const { loadMembers } = useFamilyMemberStore();
  
  // フィルタリングされたアクティビティを取得し、その中からタスクのみを抽出
  const filteredActivities = getFilteredActivities();
  const taskActivities = useMemo(() => {
    return filteredActivities.filter(activity => 
      activity.category === 'task' || activity.category === 'deadline' || activity.category === 'reminder'
    );
  }, [filteredActivities]);
  
  // 期限切れタスク
  const overdueTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return taskActivities.filter(task => 
      task.dueDate && task.dueDate < today && task.status !== 'completed'
    );
  }, [taskActivities]);
  
  // 初期データロード
  useEffect(() => {
    loadMembers();
    loadAllActivities();
  }, [loadMembers, loadAllActivities]);

  const handleAddTask = () => {
    setEditingActivity(null);
    setShowEditForm(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setShowEditForm(true);
  };

  const handleShowOverdue = () => {
    // TODO: ActivityStoreでのフィルター設定
    console.log('期限切れタスク表示');
  };

  const pendingTasks = taskActivities.filter(task => task.status === 'pending' || task.status === 'in_progress');
  const completedTasks = taskActivities.filter(task => task.status === 'completed');

  // 期限切れアラートコンポーネント
  const overdueAlert = overdueTasks.length > 0 && (
    <button
      onClick={handleShowOverdue}
      className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
    >
      <AlertCircle className="w-4 h-4" />
      <span className="text-sm font-medium">
        期限切れ {overdueTasks.length}件
      </span>
    </button>
  );

  return (
    <MobileLayout title="タスク管理" actions={overdueAlert}>
      <div className="px-4 py-6 min-h-screen bg-gray-50">
        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <h3 className="font-medium text-red-800 mb-1">エラーが発生しました</h3>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={loadAllActivities}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              再試行
            </button>
          </div>
        )}

        {/* レイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* サイドバー（デスクトップ） */}
          <div className="hidden lg:block">
            <TaskFilter />
            
            {/* 統計情報 */}
            <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">統計</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">未完了</span>
                  <span className="font-medium">{pendingTasks.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">完了</span>
                  <span className="font-medium text-green-600">{completedTasks.length}</span>
                </div>
                {overdueTasks.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">期限切れ</span>
                    <span className="font-medium text-red-600">{overdueTasks.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* メインエリア */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">読み込み中...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 未完了タスク */}
                {pendingTasks.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">
                        未完了のタスク ({pendingTasks.length})
                      </h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {pendingTasks.map((task) => (
                        <div key={task.id} className="p-4">
                          <ActivityCard activity={task} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 完了タスク */}
                {completedTasks.length > 0 && (
                  <details className="bg-white rounded-lg shadow-sm">
                    <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50">
                      <h2 className="text-lg font-medium text-gray-900">
                        完了したタスク ({completedTasks.length})
                      </h2>
                    </summary>
                    <div className="border-t border-gray-200 divide-y divide-gray-200">
                      {completedTasks.map((task) => (
                        <div key={task.id} className="p-4">
                          <ActivityCard activity={task} />
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* 空の状態 */}
                {taskActivities.length === 0 && !isLoading && (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      タスクがありません
                    </h3>
                    <p className="text-gray-600 mb-4">
                      新しいタスクを追加して始めましょう
                    </p>
                    <button
                      onClick={handleAddTask}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      最初のタスクを追加
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* モバイル用フィルター */}
        <div className="lg:hidden mt-6">
          <details className="bg-white rounded-lg shadow-sm">
            <summary className="p-4 cursor-pointer flex items-center justify-between">
              <span className="font-medium flex items-center">
                <FilterIcon className="w-4 h-4 mr-2" />
                フィルター
              </span>
            </summary>
            <div className="border-t">
              <TaskFilter />
            </div>
          </details>
        </div>
      </div>

      {/* フローティングアクションボタン */}
      <button
        onClick={handleAddTask}
        className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="タスク追加"
      >
        <Plus className="w-6 h-6" />
      </button>

    </MobileLayout>
  );
}