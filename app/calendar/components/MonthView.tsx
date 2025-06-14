'use client';

import { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Activity } from '@/domain/activity/types';
import { ActivityCard } from '@/components/activity/ActivityCard';

interface MonthViewProps {
  activities: Activity[];
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
}

export const MonthView = ({ activities, selectedDate, onDateSelect }: MonthViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 月の日付を生成
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { locale: ja });
    const end = endOfWeek(endOfMonth(currentMonth), { locale: ja });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // 日付ごとのアクティビティをグループ化
  const activitiesByDate = useMemo(() => {
    const grouped = new Map<string, Activity[]>();
    
    activities.forEach(activity => {
      // イベントの場合はstartDate、タスクの場合はdueDateを使用
      const dateKey = activity.category === 'event' 
        ? activity.startDate 
        : activity.dueDate;
      
      if (dateKey) {
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(activity);
      }
    });
    
    return grouped;
  }, [activities]);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleDateClick = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    onDateSelect(dateString);
  };

  const handleAddEvent = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    onDateSelect(dateString);
    // TODO: 統一Activityフォームの実装
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'yyyy年 M月', { locale: ja })}
        </h2>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-medium py-2 ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7">
        {monthDays.map((day, index) => {
          const dateString = format(day, 'yyyy-MM-dd');
          const dayActivities = activitiesByDate.get(dateString) || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, new Date(selectedDate));
          const isCurrentDay = isToday(day);
          const dayOfWeek = day.getDay();

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[120px] border-b border-r p-2 ${
                !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
              } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
                index % 7 === 6 ? 'border-r-0' : ''
              }`}
            >
              {/* 日付ヘッダー */}
              <div className="flex items-center justify-between mb-1">
                <button
                  onClick={() => handleDateClick(day)}
                  className={`text-sm font-medium px-2 py-0.5 rounded hover:bg-gray-100 ${
                    isCurrentDay ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
                  } ${
                    dayOfWeek === 0 ? 'text-red-600' : 
                    dayOfWeek === 6 ? 'text-blue-600' : 
                    'text-gray-900'
                  } ${!isCurrentMonth ? 'text-gray-400' : ''}`}
                >
                  {format(day, 'd')}
                </button>
                
                {isCurrentMonth && (
                  <button
                    onClick={() => handleAddEvent(day)}
                    className="opacity-0 hover:opacity-100 p-1 hover:bg-blue-100 rounded transition-opacity"
                    aria-label="イベント追加"
                  >
                    <Plus className="w-3 h-3 text-blue-600" />
                  </button>
                )}
              </div>

              {/* アクティビティリスト */}
              <div className="space-y-1 overflow-y-auto max-h-[80px]">
                {dayActivities.slice(0, 3).map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    compact
                  />
                ))}
                {dayActivities.length > 3 && (
                  <button
                    onClick={() => handleDateClick(day)}
                    className="text-xs text-blue-600 hover:text-blue-800 pl-2"
                  >
                    他 {dayActivities.length - 3} 件
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};