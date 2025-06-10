'use client';

import { useEffect, useState } from 'react';
import { Calendar, Plus, Filter as FilterIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useActivityStore } from '@/lib/store/activity-store';
import { useFamilyMemberStore } from '@/lib/store';
import { MonthView } from './components/MonthView';
import { CalendarFilter } from './components/CalendarFilter';

export default function CalendarPage() {
  const { loadAllActivities, activities, isLoading, error } = useActivityStore();
  const { loadMembers } = useFamilyMemberStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  
  // 初期データロード
  useEffect(() => {
    loadMembers();
    loadAllActivities();
  }, [loadMembers, loadAllActivities]);

  // 選択された日付のアクティビティを取得
  const getActivitiesByDate = (date: string) => {
    return activities.filter(activity => {
      if (activity.category === 'event') {
        return activity.startDate === date || activity.dueDate === date;
      } else {
        return activity.dueDate === date;
      }
    });
  };

  const selectedDateActivities = selectedDate 
    ? getActivitiesByDate(selectedDate)
    : [];

  const handleAddEvent = () => {
    setShowEventForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">カレンダー</h1>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* サイドバー（デスクトップ） */}
          <div className="hidden lg:block">
            <CalendarFilter />
            
            {/* 選択された日付のイベント */}
            {selectedDate && (
              <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  {format(new Date(selectedDate), 'M月d日のアクティビティ', { locale: ja })}
                </h3>
                {selectedDateActivities.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateActivities.map((activity) => (
                      <div key={activity.id} className="p-3 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            activity.category === 'event' ? 'bg-blue-100 text-blue-700' :
                            activity.category === 'task' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {activity.category === 'event' ? 'イベント' :
                             activity.category === 'task' ? 'タスク' :
                             activity.category}
                          </span>
                          {activity.startTime && (
                            <span className="text-xs text-gray-600">{activity.startTime}</span>
                          )}
                        </div>
                        {activity.description && (
                          <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    この日のアクティビティはありません
                  </p>
                )}
              </div>
            )}
          </div>

          {/* メインエリア */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">読み込み中...</span>
              </div>
            ) : (
              <MonthView 
                activities={activities} 
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            )}
          </div>
        </div>

        {/* モバイル用フィルターとイベント詳細 */}
        <div className="lg:hidden mt-6 space-y-4">
          {/* フィルターセクション */}
          <details className="bg-white rounded-lg shadow-sm">
            <summary className="p-4 cursor-pointer flex items-center justify-between">
              <span className="font-medium flex items-center">
                <FilterIcon className="w-4 h-4 mr-2" />
                フィルター
              </span>
            </summary>
            <div className="border-t">
              <CalendarFilter />
            </div>
          </details>

          {/* 選択された日付のアクティビティ */}
          {selectedDate && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                {format(new Date(selectedDate), 'M月d日のアクティビティ', { locale: ja })}
              </h3>
              {selectedDateActivities.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateActivities.map((activity) => (
                    <div key={activity.id} className="p-3 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          activity.category === 'event' ? 'bg-blue-100 text-blue-700' :
                          activity.category === 'task' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {activity.category === 'event' ? 'イベント' :
                           activity.category === 'task' ? 'タスク' :
                           activity.category}
                        </span>
                        {activity.startTime && (
                          <span className="text-xs text-gray-600">{activity.startTime}</span>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  この日のアクティビティはありません
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* フローティングアクションボタン */}
      <button
        onClick={handleAddEvent}
        className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="イベント追加"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* モーダル */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">新しいアクティビティ</h2>
              <p className="text-gray-600">統一Activityフォームは実装中です</p>
              <button
                onClick={() => setShowEventForm(false)}
                className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}