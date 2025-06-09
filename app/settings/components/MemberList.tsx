'use client';

import { Edit2, Trash2, Plus, Users } from 'lucide-react';
import { useFamilyMembers, useFamilyMemberStore, useFamilyMemberForm } from '@/lib/store';
import type { FamilyMember } from '@/domain/family/types';

export const MemberList = () => {
  const members = useFamilyMembers();
  const { deleteMember } = useFamilyMemberStore();
  const { openCreate, openEdit } = useFamilyMemberForm();

  const handleDelete = async (member: FamilyMember) => {
    if (window.confirm(`${member.name}さんを削除しますか？`)) {
      await deleteMember(member.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">家族メンバー</h2>
          <span className="text-sm text-gray-500">({members.length}人)</span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>追加</span>
        </button>
      </div>

      {/* メンバーリスト */}
      {members.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            まだメンバーがいません
          </h3>
          <p className="text-gray-500 mb-4">
            家族メンバーを追加して予定やタスクを共有しましょう
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>最初のメンバーを追加</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              {/* メンバー情報 */}
              <div className="flex items-center space-x-3">
                {/* アバター */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: member.color }}
                >
                  {member.avatar || member.name.charAt(0)}
                </div>
                
                {/* 名前と詳細 */}
                <div>
                  <h3 className="font-medium text-gray-900">{member.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: member.color }}
                    />
                    <span>{member.color}</span>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openEdit(member)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  aria-label={`${member.name}を編集`}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(member)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  aria-label={`${member.name}を削除`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 説明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="font-medium text-blue-900 mb-2">家族メンバーについて</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 家族メンバーを追加すると、予定やタスクを割り当てできます</li>
          <li>• 色分けで誰の予定やタスクかが一目で分かります</li>
          <li>• アバターを設定して個性を表現できます</li>
        </ul>
      </div>
    </div>
  );
};