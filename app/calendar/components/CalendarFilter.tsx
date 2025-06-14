'use client';

import { Filter, Users, CheckSquare, Calendar } from 'lucide-react';
import { useFamilyMembers } from '@/lib/store';

export const CalendarFilter = () => {
  const familyMembers = useFamilyMembers();
  
  // TODO: 統一ActivityStoreでのフィルター機能実装
  const filter = { memberIds: [] as string[], showCompleted: true };

  const handleMemberToggle = (memberId: string) => {
    // TODO: ActivityStoreでのフィルター更新
    console.log('メンバーフィルター切り替え:', memberId);
  };

  const handleClearFilter = () => {
    // TODO: ActivityStoreでのフィルタークリア
    console.log('フィルタークリア');
  };

  const hasActiveFilters = filter.memberIds.length > 0 || !filter.showCompleted;

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

        {/* 表示オプション */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <CheckSquare className="w-4 h-4 mr-1" />
            表示オプション
          </h4>
          <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input
              type="checkbox"
              checked={filter.showCompleted}
              onChange={(e) => console.log('完了済み表示切り替え:', e.target.checked)}
              className="mr-3"
            />
            <span className="text-sm">完了済みタスクを表示</span>
          </label>
        </div>
      </div>

      {/* アクティブフィルター表示 */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-600">
            <Calendar className="inline w-3 h-3 mr-1" />
            {filter.memberIds.length > 0 && `${filter.memberIds.length}人の担当者`}
            {filter.memberIds.length > 0 && !filter.showCompleted && '、'}
            {!filter.showCompleted && '未完了のみ'}
            を表示中
          </p>
        </div>
      )}
    </div>
  );
};