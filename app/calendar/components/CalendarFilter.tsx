'use client';

import React from 'react';
import { Filter, Users, CheckSquare, Calendar, Tag } from 'lucide-react';
import { useFamilyMembers } from '@/lib/store';
import { useActivityStore } from '@/lib/store/activity-store';
import type { ActivityCategory } from '@/domain/activity/types';
import type { MemberId } from '@/domain/shared/branded-types';

// カテゴリラベル定義
const categoryLabels: Record<ActivityCategory, string> = {
  event: 'イベント',
  task: 'タスク',
  appointment: '約束',
  deadline: '締切',
  meeting: '会議',
  milestone: 'マイルストーン',
  reminder: 'リマインダー'
};

export const CalendarFilter = () => {
  const familyMembers = useFamilyMembers();
  const { 
    filters,
    setFilter,
    resetFilters
  } = useActivityStore();

  const handleMemberToggle = (memberId: string) => {
    const currentIds = filters.memberIds.map(id => id as string);
    const newIds = currentIds.includes(memberId)
      ? currentIds.filter(id => id !== memberId)
      : [...currentIds, memberId];
    setFilter('memberIds', newIds.map(id => id as MemberId));
  };

  const handleCategoryToggle = (category: ActivityCategory) => {
    const currentCategories = filters.categories;
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((cat: ActivityCategory) => cat !== category)
      : [...currentCategories, category];
    setFilter('categories', newCategories);
  };

  const handleShowCompletedToggle = (show: boolean) => {
    setFilter('showCompleted', show);
  };

  const handleClearFilter = () => {
    resetFilters();
  };

  const hasActiveFilters = 
    filters.memberIds.length > 0 || 
    filters.categories.length > 0 || 
    !filters.showCompleted;

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

      {/* メンバーフィルター */}
      <div className="space-y-3">
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
                  checked={filters.memberIds.includes(member.id)}
                  onChange={() => handleMemberToggle(member.id)}
                  className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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

        {/* カテゴリフィルター */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Tag className="w-4 h-4 mr-1" />
            カテゴリで絞り込み
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(categoryLabels) as ActivityCategory[]).map((category) => (
              <label
                key={category}
                className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded text-sm"
              >
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{categoryLabels[category]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 表示オプション */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <CheckSquare className="w-4 h-4 mr-1" />
            表示オプション
          </h4>
          <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input
              type="checkbox"
              checked={filters.showCompleted}
              onChange={(e) => handleShowCompletedToggle(e.target.checked)}
              className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">完了済みアクティビティを表示</span>
          </label>
        </div>
      </div>

      {/* アクティブフィルター表示 */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-600">
            <Calendar className="inline w-3 h-3 mr-1" />
            {filters.memberIds.length > 0 && `${filters.memberIds.length}人の担当者`}
            {filters.memberIds.length > 0 && (filters.categories.length > 0 || !filters.showCompleted) && '、'}
            {filters.categories.length > 0 && `${filters.categories.length}カテゴリ`}
            {filters.categories.length > 0 && !filters.showCompleted && '、'}
            {!filters.showCompleted && '未完了のみ'}
            を表示中
          </p>
        </div>
      )}
    </div>
  );
};