'use client';

import React from 'react';
import type { Activity } from '@/domain/activity/types';
import { useActivityStore } from '@/lib/store/activity-store';
import { useFamilyMembers } from '@/lib/store';
import { trackUserAction } from '@/components/pwa/ContextualInstallPrompt';

interface ActivityCardProps {
  activity: Activity;
  compact?: boolean;
  showDate?: boolean;
}

const priorityStyles = {
  high: 'border-l-red-400',
  medium: 'border-l-yellow-400',
  low: 'border-l-green-400'
};

const categoryLabels: Record<string, string> = {
  event: 'イベント',
  task: 'タスク',
  deadline: '締切'
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric'
  });
};

const isOverdue = (activity: Activity): boolean => {
  if (!activity.dueDate || activity.status === 'completed') return false;
  return new Date(activity.dueDate) < new Date();
};

const calculateChecklistProgress = (checklist: Activity['checklist']) => {
  if (checklist.length === 0) return { completed: 0, total: 0, percentage: 0 };
  const completed = checklist.filter(item => item.checked).length;
  const total = checklist.length;
  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
};

export const ActivityCard: React.FC<ActivityCardProps> = ({ 
  activity, 
  compact = false,
  showDate = false 
}) => {
  const {
    updateActivity,
    deleteActivity,
    completeActivity,
    reopenActivity,
    selectActivity,
    isLoading,
    error
  } = useActivityStore();
  
  const familyMembers = useFamilyMembers();
  
  const overdue = isOverdue(activity);
  const checklistProgress = calculateChecklistProgress(activity.checklist);
  const priorityClass = overdue ? 'border-l-red-400' : priorityStyles[activity.priority];
  
  const assignedMembers = familyMembers.filter(member => 
    activity.memberIds.includes(member.id as any)
  );

  const handleCardClick = () => {
    selectActivity(activity.id);
  };

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (activity.status === 'completed') {
      await reopenActivity(activity.id);
    } else {
      await completeActivity(activity.id);
      
      // ユーザー行動を追跡（アクティビティ完了）
      trackUserAction('activity_completed', activity.category);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: 統一Activityフォームが実装されたら適切なアクションを実行
    console.log('Edit activity:', activity.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const confirmed = window.confirm(`「${activity.title}」を削除しますか？`);
    if (confirmed) {
      await deleteActivity(activity.id);
    }
  };

  const handleChecklistToggle = async (itemId: string) => {
    const updatedChecklist = activity.checklist.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    
    await updateActivity(activity.id, { checklist: updatedChecklist });
  };

  return (
    <article 
      data-testid="activity-card"
      className={`bg-white rounded-lg border-l-4 ${priorityClass} shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4`}
      onClick={handleCardClick}
    >
      {/* Error Display */}
      {error && (
        <div className="text-red-600 text-sm mb-2">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{activity.title}</h3>
          
          {/* Category Badge */}
          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            {categoryLabels[activity.category]}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-1 ml-2">
          <button
            onClick={handleStatusToggle}
            disabled={isLoading}
            aria-label={activity.status === 'completed' ? '未完了に戻す' : '完了にする'}
            className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-50"
          >
            {activity.status === 'completed' ? '↶' : '✓'}
          </button>
          
          <button
            onClick={handleEdit}
            aria-label="編集"
            className="p-1 text-gray-400 hover:text-blue-600"
          >
            ✏️
          </button>
          
          <button
            onClick={handleDelete}
            aria-label="削除"
            className="p-1 text-gray-400 hover:text-red-600"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Description (only in non-compact mode) */}
      {!compact && activity.description && (
        <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
      )}

      {/* Overdue Indicator */}
      {overdue && (
        <div className="text-red-600 text-sm font-medium mb-2">
          期限切れ
        </div>
      )}

      {/* Completion Status */}
      {activity.status === 'completed' && activity.completedAt && (
        <div className="text-green-600 text-sm mb-2">
          完了: {formatDate(activity.completedAt)}
        </div>
      )}

      {/* Due Date */}
      {activity.dueDate && (
        <div className="text-gray-500 text-sm mb-2">
          期限: {formatDate(activity.dueDate)}
        </div>
      )}

      {/* Start Date/Time for Events */}
      {activity.category === 'event' && activity.startDate && (
        <div className="text-gray-500 text-sm mb-2">
          {formatDate(activity.startDate)}
          {activity.startTime && ` ${activity.startTime}`}
          {activity.endTime && ` - ${activity.endTime}`}
        </div>
      )}

      {/* Creation Date (when showDate is true) */}
      {showDate && (
        <div className="text-gray-400 text-xs mb-2">
          作成日: {formatDate(activity.createdAt)}
        </div>
      )}

      {/* Assigned Members */}
      {assignedMembers.length > 0 && (
        <div className="flex items-center space-x-2 mb-3">
          {assignedMembers.slice(0, compact ? 2 : assignedMembers.length).map(member => (
            <div key={member.id} className="flex items-center space-x-1">
              <span className="text-sm">{member.avatar}</span>
              <span className="text-sm text-gray-700">{member.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Checklist */}
      {activity.checklist.length > 0 && (
        <div className="space-y-2">
          {/* Progress Summary */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {checklistProgress.completed}/{checklistProgress.total} 完了
            </span>
            <span className="text-gray-500">
              {checklistProgress.percentage}%
            </span>
          </div>

          {/* Checklist Items */}
          <div className="space-y-1">
            {activity.checklist.map(item => (
              <label key={item.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => handleChecklistToggle(item.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-sm ${item.checked ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                  {item.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};