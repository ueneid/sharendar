'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { useFamilyMemberStore, useFamilyMemberForm, useFamilyMemberAsync } from '@/lib/store';

// 利用可能なカラーパレット
const MEMBER_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
];

// アバター絵文字
const AVATAR_EMOJIS = [
  '👨', '👩', '👦', '👧', '🧑', '👴', '👵',
  '👶', '🧒', '👱', '🧔', '👨‍🦱', '👩‍🦱',
  '👨‍🦳', '👩‍🦳', '👨‍🦲', '👩‍🦲'
];

export const MemberForm = () => {
  const { createMember, updateMember } = useFamilyMemberStore();
  const { isOpen, editingMember, close } = useFamilyMemberForm();
  const { loading, error, setError } = useFamilyMemberAsync();
  
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(MEMBER_COLORS[0]);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [nameError, setNameError] = useState('');

  // フォームの初期化
  useEffect(() => {
    if (isOpen) {
      if (editingMember) {
        // 編集モード
        setName(editingMember.name);
        setSelectedColor(editingMember.color);
        setSelectedAvatar(editingMember.avatar || '');
      } else {
        // 新規作成モード
        setName('');
        setSelectedColor(MEMBER_COLORS[0]);
        setSelectedAvatar('');
      }
      setNameError('');
      setError(null);
    }
  }, [isOpen, editingMember, setError]);

  const validateForm = (): boolean => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setNameError('名前を入力してください');
      return false;
    }
    
    if (trimmedName.length > 20) {
      setNameError('名前は20文字以内で入力してください');
      return false;
    }
    
    setNameError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const memberData = {
      name: name.trim(),
      color: selectedColor,
      avatar: selectedAvatar || undefined,
    };

    try {
      if (editingMember) {
        await updateMember(editingMember.id, memberData);
      } else {
        await createMember(memberData.name, {
          color: memberData.color,
          avatar: memberData.avatar,
        });
      }
    } catch (error) {
      console.error('Member save error:', error);
    }
  };

  const handleClose = () => {
    close();
    setNameError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {editingMember ? 'メンバー編集' : 'メンバー追加'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6" role="form">
          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 名前入力 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              名前 *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                nameError ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="家族メンバーの名前を入力"
              disabled={loading}
              maxLength={20}
            />
            {nameError && (
              <p className="text-red-600 text-sm mt-1">{nameError}</p>
            )}
          </div>

          {/* カラー選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カラー
            </label>
            <div className="grid grid-cols-8 gap-2">
              {MEMBER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor === color ? 'border-gray-400' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={loading}
                  aria-label={`カラー ${color}`}
                />
              ))}
            </div>
          </div>

          {/* アバター選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              アバター（任意）
            </label>
            <div className="grid grid-cols-8 gap-2">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`w-8 h-8 flex items-center justify-center text-lg border rounded ${
                    selectedAvatar === emoji 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {selectedAvatar && (
              <button
                type="button"
                onClick={() => setSelectedAvatar('')}
                className="text-sm text-gray-500 hover:text-gray-700 mt-2"
                disabled={loading}
              >
                アバターをクリア
              </button>
            )}
          </div>

          {/* ボタン */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingMember ? '更新' : '追加'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};