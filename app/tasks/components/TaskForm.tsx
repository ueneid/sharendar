'use client';

import { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, Users, FileText, Plus, Trash2, Loader2 } from 'lucide-react';
import { useTaskStore, useTaskForm, useTaskAsync } from '@/lib/store/tasks-store';
import { useFamilyMembers } from '@/lib/store';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { TaskPriority } from '@/domain/tasks/types';

export const TaskForm = () => {
  const { createTask, updateTask } = useTaskStore();
  const { isOpen, editingTask } = useTaskForm();
  const { closeTaskForm } = useTaskStore();
  const { loading, error, setError } = useTaskAsync();
  const familyMembers = useFamilyMembers();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [checklist, setChecklist] = useState<Array<{ id: string; title: string }>>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // フォームの初期化
  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        // 編集モード
        setTitle(editingTask.title);
        setDueDate(editingTask.dueDate || '');
        setPriority(editingTask.priority);
        setSelectedMemberIds([...editingTask.memberIds]);
        setMemo(editingTask.memo || '');
        setChecklist(editingTask.checklist.map(item => ({
          id: item.id,
          title: item.title,
        })));
      } else {
        // 新規作成モード
        setTitle('');
        setDueDate('');
        setPriority('medium');
        setSelectedMemberIds([]);
        setMemo('');
        setChecklist([]);
      }
      setNewChecklistItem('');
      setErrors({});
      setError(null);
    }
  }, [isOpen, editingTask, setError]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'タイトルを入力してください';
    } else if (title.trim().length > 100) {
      newErrors.title = 'タイトルは100文字以内で入力してください';
    }

    if (dueDate) {
      const selectedDate = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.dueDate = '期限は今日以降の日付を選択してください';
      }
    }

    if (memo && memo.length > 500) {
      newErrors.memo = 'メモは500文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const taskData = {
      title: title.trim(),
      dueDate: dueDate || undefined,
      priority,
      memberIds: selectedMemberIds,
      memo: memo.trim() || undefined,
      checklist: checklist.map(item => ({ title: item.title })),
    };

    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title: taskData.title as any,
          dueDate: taskData.dueDate as any,
          priority: taskData.priority,
          memberIds: taskData.memberIds as any,
          memo: taskData.memo,
          checklist: taskData.checklist.map(item => ({
            id: `item_${Date.now()}`,
            title: item.title,
            checked: false,
          })),
        } as any);
      } else {
        await createTask(taskData.title, {
          dueDate: taskData.dueDate as any,
          priority: taskData.priority,
          memberIds: taskData.memberIds,
          memo: taskData.memo,
          checklist: taskData.checklist,
        });
      }
    } catch (error) {
      console.error('Task save error:', error);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;

    const newItem = {
      id: `temp_${Date.now()}`,
      title: newChecklistItem.trim(),
    };

    setChecklist(prev => [...prev, newItem]);
    setNewChecklistItem('');
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  const updateChecklistItem = (id: string, title: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, title } : item
    ));
  };

  const handleClose = () => {
    closeTaskForm();
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {editingTask ? 'タスク編集' : 'タスク追加'}
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
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* タイトル */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              タイトル *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="タスクのタイトル"
              disabled={loading}
              maxLength={100}
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* 期限・優先度 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                期限
              </label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dueDate ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.dueDate && (
                <p className="text-red-600 text-sm mt-1">{errors.dueDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                優先度
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
          </div>

          {/* 担当者 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline w-4 h-4 mr-1" />
              担当者
            </label>
            <div className="space-y-2">
              {familyMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(member.id)}
                    onChange={() => toggleMemberSelection(member.id)}
                    className="mr-3"
                    disabled={loading}
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
                <p className="text-gray-500 text-sm">
                  まだ家族メンバーがいません
                </p>
              )}
            </div>
          </div>

          {/* チェックリスト */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              チェックリスト
            </label>
            
            {/* 既存アイテム */}
            <div className="space-y-2 mb-3">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="チェックリスト項目"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* 新規追加 */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="新しいチェックリスト項目"
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChecklistItem();
                  }
                }}
              />
              <button
                type="button"
                onClick={addChecklistItem}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                disabled={loading || !newChecklistItem.trim()}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* メモ */}
          <div>
            <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="inline w-4 h-4 mr-1" />
              メモ
            </label>
            <textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.memo ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="メモ（任意）"
              rows={3}
              disabled={loading}
              maxLength={500}
            />
            {errors.memo && (
              <p className="text-red-600 text-sm mt-1">{errors.memo}</p>
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
              disabled={loading || !title.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingTask ? '更新' : '追加'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};