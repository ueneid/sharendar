'use client';

import { Filter, Users, CheckSquare, Calendar, AlertTriangle } from 'lucide-react';
import { useTaskStore, useTaskFilter } from '@/lib/store/tasks-store';
import { useFamilyMembers } from '@/lib/store';
import type { TaskPriority } from '@/domain/tasks/types';

export const TaskFilter = () => {
  const { setFilter, clearFilter } = useTaskStore();
  const filter = useTaskFilter();
  const familyMembers = useFamilyMembers();

  const handleMemberToggle = (memberId: string) => {
    const newMemberIds = filter.memberIds.includes(memberId)
      ? filter.memberIds.filter(id => id !== memberId)
      : [...filter.memberIds, memberId];
    
    setFilter({ memberIds: newMemberIds });
  };

  const handleStatusChange = (status: typeof filter.status) => {
    setFilter({ status });
  };

  const handlePriorityChange = (priority: TaskPriority | 'all') => {
    setFilter({ priority });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setFilter({
      dueDateRange: {
        ...filter.dueDateRange,
        [field]: value || undefined,
      }
    });
  };

  const handleClearFilter = () => {
    clearFilter();
  };

  const hasActiveFilters = 
    filter.memberIds.length > 0 || 
    filter.status !== 'all' || 
    filter.priority !== 'all' ||
    filter.dueDateRange.start ||
    filter.dueDateRange.end;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 flex items-center">
          <Filter className="w-4 h-4 mr-2" />
          フィルター
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilter}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            クリア
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* ステータスフィルター */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <CheckSquare className="w-4 h-4 mr-1" />
            ステータス
          </h4>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'すべて' },
              { value: 'pending', label: '未完了' },
              { value: 'completed', label: '完了' }
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={filter.status === option.value}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className="mr-3"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 優先度フィルター */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            優先度
          </h4>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'すべて' },
              { value: 'high', label: '高', color: 'text-red-600' },
              { value: 'medium', label: '中', color: 'text-yellow-600' },
              { value: 'low', label: '低', color: 'text-green-600' }
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="radio"
                  name="priority"
                  value={option.value}
                  checked={filter.priority === option.value}
                  onChange={(e) => handlePriorityChange(e.target.value as any)}
                  className="mr-3"
                />
                <span className={`text-sm ${option.color || ''}`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* メンバーフィルター */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Users className="w-4 h-4 mr-1" />
            担当者で絞り込み
          </h4>
          <div className="space-y-2">
            {familyMembers.map((member) => (
              <label
                key={member.id}
                className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={filter.memberIds.includes(member.id)}
                  onChange={() => handleMemberToggle(member.id)}
                  className="mr-3"
                />
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mr-2"
                  style={{ backgroundColor: member.color }}
                >
                  {member.avatar || member.name.charAt(0)}
                </div>
                <span className="text-sm">{member.name}</span>
              </label>
            ))}
            {familyMembers.length === 0 && (
              <p className="text-gray-500 text-sm p-2">
                メンバーがまだ登録されていません
              </p>
            )}
          </div>
        </div>

        {/* 期限フィルター */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            期限で絞り込み
          </h4>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">開始日</label>
              <input
                type="date"
                value={filter.dueDateRange.start || ''}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">終了日</label>
              <input
                type="date"
                value={filter.dueDateRange.end || ''}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* アクティブフィルター表示 */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-600">
            <Filter className="inline w-3 h-3 mr-1" />
            フィルター適用中:
            {filter.status !== 'all' && ` ${filter.status === 'pending' ? '未完了' : '完了'}`}
            {filter.priority !== 'all' && ` ${filter.priority}優先度`}
            {filter.memberIds.length > 0 && ` ${filter.memberIds.length}人の担当者`}
            {(filter.dueDateRange.start || filter.dueDateRange.end) && ' 期限指定'}
          </p>
        </div>
      )}
    </div>
  );
};