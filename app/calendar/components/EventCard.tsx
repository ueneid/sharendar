'use client';

import { Clock, Users, FileText, Edit2, Trash2 } from 'lucide-react';
import type { CalendarEvent } from '@/domain/calendar/types';
import { useFamilyMembers } from '@/lib/store';
import { useCalendarStore } from '@/lib/store/calendar-store';

interface EventCardProps {
  event: CalendarEvent;
  showDate?: boolean;
  compact?: boolean;
}

export const EventCard = ({ event, showDate = false, compact = false }: EventCardProps) => {
  const { openEventForm, deleteEvent, selectEvent } = useCalendarStore();
  const familyMembers = useFamilyMembers();

  const assignedMembers = event.memberIds
    .map(id => familyMembers.find(member => member.id === id))
    .filter((member): member is NonNullable<typeof member> => member !== undefined);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEventForm(event);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`「${event.title}」を削除しますか？`)) {
      await deleteEvent(event.id);
    }
  };

  const handleClick = () => {
    selectEvent(event.id);
  };

  const eventTypeStyle = event.type === 'task' 
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
              {event.title}
            </p>
            {event.time && (
              <p className="text-xs text-gray-500">
                <Clock className="inline w-3 h-3 mr-1" />
                {event.time}
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
          <h3 className="font-medium text-gray-900">{event.title}</h3>
          {showDate && (
            <p className="text-sm text-gray-600 mt-1">
              {new Date(event.date).toLocaleDateString('ja-JP', {
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
        {event.time && (
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span>{event.time}</span>
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

        {/* メモ */}
        {event.memo && (
          <div className="flex items-start text-sm text-gray-600">
            <FileText className="w-4 h-4 mr-2 mt-0.5" />
            <p className="break-words">{event.memo}</p>
          </div>
        )}
      </div>

      {/* タイプラベル */}
      <div className="mt-3 flex items-center justify-between">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          event.type === 'task' 
            ? 'bg-amber-100 text-amber-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {event.type === 'task' ? 'タスク' : 'イベント'}
        </span>
      </div>
    </div>
  );
};