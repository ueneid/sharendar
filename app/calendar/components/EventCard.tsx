'use client';

import { Clock, Users, FileText, Edit2, Trash2 } from 'lucide-react';
import type { Activity } from '@/domain/activity/types';
import { useFamilyMembers } from '@/lib/store';

interface EventCardProps {
  activity: Activity;
  showDate?: boolean;
  compact?: boolean;
}

export const EventCard = ({ activity, showDate = false, compact = false }: EventCardProps) => {
  const familyMembers = useFamilyMembers();

  const assignedMembers = activity.memberIds
    .map(id => familyMembers.find(member => member.id === id))
    .filter((member): member is NonNullable<typeof member> => member !== undefined);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: 統一Activityフォームでの編集
    console.log('編集:', activity.title);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`「${activity.title}」を削除しますか？`)) {
      // TODO: ActivityStoreでの削除
      console.log('削除:', activity.title);
    }
  };

  const handleClick = () => {
    // TODO: Activity詳細表示
    console.log('選択:', activity.title);
  };

  const eventTypeStyle = activity.category === 'task' 
    ? 'border-l-4 border-l-amber-400 bg-amber-50' 
    : 'border-l-4 border-l-blue-400 bg-blue-50';

  if (compact) {
    return (
      <div
        className={`p-2 rounded cursor-pointer hover:shadow-md transition-shadow ${eventTypeStyle}`}
        onClick={handleClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {activity.title}
            </p>
            {activity.startTime && (
              <p className="text-xs text-gray-500">
                <Clock className="inline w-3 h-3 mr-1" />
                {activity.startTime}
              </p>
            )}
          </div>
          {assignedMembers.length > 0 && (
            <div className="flex -space-x-1 ml-2">
              {assignedMembers.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] ring-2 ring-white"
                  style={{ backgroundColor: member.color }}
                  title={member.name}
                >
                  {member.avatar || member.name.charAt(0)}
                </div>
              ))}
              {assignedMembers.length > 3 && (
                <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-[10px] ring-2 ring-white">
                  +{assignedMembers.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg cursor-pointer hover:shadow-lg transition-shadow ${eventTypeStyle}`}
      onClick={handleClick}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{activity.title}</h3>
          {showDate && (
            <p className="text-sm text-gray-600 mt-1">
              {activity.startDate && new Date(activity.startDate).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleEdit}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
            aria-label="編集"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
            aria-label="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 詳細情報 */}
      <div className="space-y-2">
        {/* 時刻 */}
        {activity.startTime && (
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span>{activity.startTime}</span>
          </div>
        )}

        {/* 担当者 */}
        {assignedMembers.length > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <div className="flex items-center space-x-2">
              {assignedMembers.map((member) => (
                <div key={member.id} className="flex items-center">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs mr-1"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.avatar || member.name.charAt(0)}
                  </div>
                  <span>{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 説明 */}
        {activity.description && (
          <div className="flex items-start text-sm text-gray-600">
            <FileText className="w-4 h-4 mr-2 mt-0.5" />
            <p className="break-words">{activity.description}</p>
          </div>
        )}
      </div>

      {/* タイプラベル */}
      <div className="mt-3 flex items-center justify-between">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          activity.category === 'task' 
            ? 'bg-amber-100 text-amber-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {activity.category === 'task' ? 'タスク' : 
           activity.category === 'event' ? 'イベント' : 
           activity.category}
        </span>
      </div>
    </div>
  );
};