'use client';

import { useEffect } from 'react';
import { Calendar, CheckSquare, Upload, Users, Plus, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useActivityStore } from '@/lib/store/activity-store';
import { useFamilyMemberStore, useFamilyMembers } from '@/lib/store';
import type { DateString } from '@/domain/shared/branded-types';

export default function HomePage() {
  const { loadAllActivities, activities } = useActivityStore();
  const { loadMembers } = useFamilyMemberStore();
  const familyMembers = useFamilyMembers();

  // 初期データロード
  useEffect(() => {
    loadMembers();
    loadAllActivities();
  }, [loadMembers, loadAllActivities]);

  // 今日・明日・明後日のデータ
  const today = new Date().toISOString().split('T')[0] as DateString;
  const tomorrow = addDays(new Date(), 1).toISOString().split('T')[0] as DateString;
  const dayAfterTomorrow = addDays(new Date(), 2).toISOString().split('T')[0] as DateString;

  // Activityからイベントとタスクを分離
  const eventActivities = activities.filter(activity => activity.category === 'event');
  const taskActivities = activities.filter(activity => 
    activity.category === 'task' || activity.category === 'deadline'
  );

  // 今日のデータ
  const todayEvents = eventActivities.filter(activity =>
    activity.startDate === today || activity.dueDate === today
  );
  const todayTasks = taskActivities.filter(activity => 
    activity.dueDate === today && activity.status === 'pending'
  );

  // 明日のデータ
  const tomorrowEvents = eventActivities.filter(activity =>
    activity.startDate === tomorrow || activity.dueDate === tomorrow
  );
  const tomorrowTasks = taskActivities.filter(activity => 
    activity.dueDate === tomorrow && activity.status === 'pending'
  );

  // 期限切れタスク
  const overdueTasks = taskActivities.filter(activity => 
    activity.dueDate && activity.dueDate < today && activity.status === 'pending'
  );

  // 統計
  const completedTasksCount = taskActivities.filter(activity => activity.status === 'completed').length;
  const pendingTasksCount = taskActivities.filter(activity => activity.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sharendar</h1>
            <p className="text-gray-600">
              家族の予定とタスクを簡単に共有
            </p>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* アラート */}
        {overdueTasks.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-medium text-red-800">
                期限切れのタスクがあります
              </h3>
            </div>
            <p className="text-red-600 text-sm mt-1">
              {overdueTasks.length}件のタスクが期限を過ぎています
            </p>
            <Link
              href="/tasks"
              className="inline-block mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              確認する
            </Link>
          </div>
        )}

        {/* 機能ナビゲーション */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/calendar"
            className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow"
          >
            <Calendar className="w-12 h-12 text-blue-600" />
            <span className="font-medium text-gray-900">カレンダー</span>
            <span className="text-xs text-gray-500 text-center">家族の予定を管理</span>
          </Link>

          <Link
            href="/tasks"
            className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow"
          >
            <CheckSquare className="w-12 h-12 text-blue-600" />
            <span className="font-medium text-gray-900">タスク</span>
            <span className="text-xs text-gray-500 text-center">やることリスト</span>
          </Link>

          <Link
            href="/ocr"
            className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow"
          >
            <Upload className="w-12 h-12 text-blue-600" />
            <span className="font-medium text-gray-900">OCR読取</span>
            <span className="text-xs text-gray-500 text-center">プリントを撮影</span>
          </Link>

          <Link
            href="/settings"
            className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-shadow"
          >
            <Users className="w-12 h-12 text-blue-600" />
            <span className="font-medium text-gray-900">設定</span>
            <span className="text-xs text-gray-500 text-center">家族メンバー管理</span>
          </Link>
        </div>

        {/* 統計ダッシュボード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">家族メンバー</h3>
                <p className="text-2xl font-bold text-gray-900">{familyMembers.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">未完了タスク</h3>
                <p className="text-2xl font-bold text-gray-900">{pendingTasksCount}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">完了タスク</h3>
                <p className="text-2xl font-bold text-gray-900">{completedTasksCount}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* 今日の予定とタスク */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 今日の予定 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                今日の予定 ({todayEvents.length})
              </h2>
            </div>
            <div className="p-4">
              {todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.map((activity) => (
                    <div key={activity.id} className="p-3 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      {activity.startTime && (
                        <p className="text-sm text-gray-600">{activity.startTime}</p>
                      )}
                      {activity.description && (
                        <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  今日の予定はありません
                </p>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/calendar"
                  className="text-blue-600 text-sm hover:text-blue-800 font-medium"
                >
                  カレンダーを見る →
                </Link>
              </div>
            </div>
          </div>

          {/* 今日のタスク */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <CheckSquare className="w-5 h-5 mr-2 text-blue-600" />
                今日のタスク ({todayTasks.length})
              </h2>
            </div>
            <div className="p-4">
              {todayTasks.length > 0 ? (
                <div className="space-y-3">
                  {todayTasks.map((activity) => (
                    <div key={activity.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          activity.priority === 'high' ? 'bg-red-100 text-red-700' :
                          activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {activity.priority === 'high' ? '高' : 
                           activity.priority === 'medium' ? '中' : '低'}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                      )}
                      {activity.checklist && activity.checklist.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          チェックリスト: {activity.checklist.filter(item => item.checked).length}/{activity.checklist.length}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  今日のタスクはありません
                </p>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/tasks"
                  className="text-blue-600 text-sm hover:text-blue-800 font-medium"
                >
                  タスク一覧を見る →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 明日の予定 */}
        {(tomorrowEvents.length > 0 || tomorrowTasks.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                明日の予定
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 明日のイベント */}
                {tomorrowEvents.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      イベント ({tomorrowEvents.length})
                    </h3>
                    <div className="space-y-2">
                      {tomorrowEvents.map((activity) => (
                        <div key={activity.id} className="p-2 border border-gray-200 rounded">
                          <h5 className="font-medium text-sm text-gray-900">{activity.title}</h5>
                          {activity.startTime && (
                            <p className="text-xs text-gray-600">{activity.startTime}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 明日のタスク */}
                {tomorrowTasks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      タスク ({tomorrowTasks.length})
                    </h3>
                    <div className="space-y-2">
                      {tomorrowTasks.map((activity) => (
                        <div key={activity.id} className="p-2 border border-gray-200 rounded">
                          <h5 className="font-medium text-sm text-gray-900">{activity.title}</h5>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-xs px-1 py-0.5 rounded ${
                              activity.priority === 'high' ? 'bg-red-100 text-red-700' :
                              activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {activity.priority === 'high' ? '高' : 
                               activity.priority === 'medium' ? '中' : '低'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* クイックアクション */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-4">クイックアクション</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/calendar"
              className="flex items-center space-x-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">予定追加</span>
            </Link>

            <Link
              href="/tasks"
              className="flex items-center space-x-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">タスク追加</span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center space-x-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">メンバー追加</span>
            </Link>

            <Link
              href="/ocr"
              className="flex items-center space-x-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">プリント読取</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}