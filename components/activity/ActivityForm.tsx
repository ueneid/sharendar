'use client';

import React, { useState, useEffect } from 'react';
import type { Activity, ActivityCategory, ActivityPriority, CreateActivityCommand, UpdateActivityCommand } from '@/domain/activity/types';
import type { ActivityId } from '@/domain/shared/branded-types';
import { useActivityStore } from '@/lib/store/activity-store';
import { useFamilyMembers } from '@/lib/store';
import { useIsOnline } from '@/lib/hooks/useOnlineStatus';
import { trackUserAction } from '@/components/pwa/ContextualInstallPrompt';

interface ActivityFormProps {
  mode: 'create' | 'edit';
  activity?: Activity;
  onClose: () => void;
  onSubmit?: () => void;
}

interface FormData {
  title: string;
  description: string;
  category: ActivityCategory;
  priority: ActivityPriority;
  memberIds: string[];
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  dueDate: string;
  isAllDay: boolean;
  checklist: Array<{ title: string; checked?: boolean }>;
}

interface FormErrors {
  title?: string;
  startTime?: string;
  endTime?: string;
  general?: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  category: 'task',
  priority: 'medium',
  memberIds: [],
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  dueDate: '',
  isAllDay: false, // デフォルトはfalseに変更
  checklist: []
};

export const ActivityForm: React.FC<ActivityFormProps> = ({
  mode,
  activity,
  onClose,
  onSubmit
}) => {
  const { createActivity, updateActivity, isLoading, error, clearError } = useActivityStore();
  const familyMembers = useFamilyMembers();
  const isOnline = useIsOnline();
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 編集モードの場合、既存データでフォームを初期化
  useEffect(() => {
    if (mode === 'edit' && activity) {
      setFormData({
        title: activity.title,
        description: activity.description || '',
        category: activity.category,
        priority: activity.priority,
        memberIds: [...activity.memberIds],
        startDate: activity.startDate || '',
        startTime: activity.startTime || '',
        endDate: activity.endDate || '',
        endTime: activity.endTime || '',
        dueDate: activity.dueDate || '',
        isAllDay: activity.isAllDay,
        checklist: activity.checklist.map(item => ({ title: item.title, checked: item.checked }))
      });
    }
  }, [mode, activity]);

  // フォーム変更時にエラーをクリア
  const handleFieldChange = () => {
    if (error) {
      clearError();
    }
    setFormErrors({});
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    handleFieldChange();
  };

  const handleMemberToggle = (memberId: string) => {
    const updatedMemberIds = formData.memberIds.includes(memberId)
      ? formData.memberIds.filter(id => id !== memberId)
      : [...formData.memberIds, memberId];
    
    handleInputChange('memberIds', updatedMemberIds);
  };

  const handleChecklistAdd = () => {
    handleInputChange('checklist', [...formData.checklist, { title: '', checked: false }]);
  };

  const handleChecklistRemove = (index: number) => {
    const updatedChecklist = formData.checklist.filter((_, i) => i !== index);
    handleInputChange('checklist', updatedChecklist);
  };

  const handleChecklistChange = (index: number, title: string) => {
    const updatedChecklist = formData.checklist.map((item, i) => 
      i === index ? { ...item, title } : item
    );
    handleInputChange('checklist', updatedChecklist);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // 必須フィールドの検証
    if (!formData.title.trim()) {
      errors.title = 'タイトルを入力してください';
    }

    // 時間形式の検証（イベントで終日でない場合）
    if (formData.category === 'event' && !formData.isAllDay) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (formData.startTime && !timeRegex.test(formData.startTime)) {
        errors.startTime = '正しい時間形式で入力してください (HH:MM)';
      }
      
      if (formData.endTime && !timeRegex.test(formData.endTime)) {
        errors.endTime = '正しい時間形式で入力してください (HH:MM)';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const command: CreateActivityCommand = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          priority: formData.priority,
          memberIds: formData.memberIds,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          dueDate: formData.dueDate || undefined,
          isAllDay: formData.isAllDay,
          checklist: formData.checklist
            .filter(item => item.title.trim())
            .map((item, index) => ({
              id: `item-${index}`,
              title: item.title.trim(),
              checked: item.checked || false
            }))
        };

        // イベントの時間設定
        if (formData.category === 'event' && !formData.isAllDay) {
          Object.assign(command, {
            startTime: formData.startTime || undefined,
            endTime: formData.endTime || undefined
          });
        }

        await createActivity(command);
        
        // ユーザー行動を追跡（アクティビティ作成）
        trackUserAction('activity_created', formData.category);
      } else if (mode === 'edit' && activity) {
        const command: UpdateActivityCommand = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          priority: formData.priority,
          memberIds: formData.memberIds,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          dueDate: formData.dueDate || undefined,
          isAllDay: formData.isAllDay,
          checklist: formData.checklist
            .filter(item => item.title.trim())
            .map((item, index) => ({
              id: `item-${index}`,
              title: item.title.trim(),
              checked: item.checked || false
            }))
        };

        // イベントの時間設定
        if (formData.category === 'event' && !formData.isAllDay) {
          Object.assign(command, {
            startTime: formData.startTime || undefined,
            endTime: formData.endTime || undefined
          });
        }

        await updateActivity(activity.id, command);
      }

      // 楽観的UI更新：成功時にすぐにフォームを閉じる
      onSubmit?.();
      onClose();
    } catch (err) {
      setFormErrors({ general: err instanceof Error ? err.message : '操作に失敗しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (error) {
      clearError();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {mode === 'create' ? 'アクティビティ作成' : 'アクティビティ編集'}
          </h2>
          <button
            onClick={handleClose}
            aria-label="閉じる"
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} role="form" className="p-6 space-y-6">
          {/* オフライン状態の警告 */}
          {!isOnline && (
            <div role="alert" className="text-orange-700 text-sm bg-orange-50 p-3 rounded border-l-4 border-orange-400">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>
                  オフライン中です。データは端末に保存され、接続復帰時に同期されます。
                </span>
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {(error || formErrors.general) && (
            <div role="alert" className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error || formErrors.general}
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
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="アクティビティのタイトルを入力"
            />
            {formErrors.title && (
              <p role="alert" className="text-red-600 text-sm mt-1">{formErrors.title}</p>
            )}
          </div>

          {/* 説明 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="詳細な説明（任意）"
            />
          </div>

          {/* カテゴリと優先度 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value as ActivityCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="task">タスク</option>
                <option value="event">イベント</option>
                <option value="deadline">deadline</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                優先度 *
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value as ActivityPriority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
          </div>

          {/* 日付・時間フィールド */}
          {formData.category === 'event' && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isAllDay}
                    onChange={(e) => handleInputChange('isAllDay', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">終日</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    開始日
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    終了日
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {!formData.isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                      開始時間
                    </label>
                    <input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formErrors.startTime && (
                      <p role="alert" className="text-red-600 text-sm mt-1">{formErrors.startTime}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                      終了時間
                    </label>
                    <input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formErrors.endTime && (
                      <p role="alert" className="text-red-600 text-sm mt-1">{formErrors.endTime}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 期限（タスクとデッドライン） */}
          {(formData.category === 'task' || formData.category === 'deadline') && (
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                期限
              </label>
              <input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* 担当者選択 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">担当者</h3>
            <div className="space-y-2">
              {familyMembers.map(member => (
                <label key={member.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.memberIds.includes(member.id)}
                    onChange={() => handleMemberToggle(member.id)}
                    className="rounded border-gray-300"
                    aria-label={member.name}
                  />
                  <span className="text-sm">{member.avatar}</span>
                  <span className="text-sm text-gray-700">{member.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* チェックリスト */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">チェックリスト</h3>
              <button
                type="button"
                onClick={handleChecklistAdd}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                項目を追加
              </button>
            </div>
            <div className="space-y-2">
              {formData.checklist.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleChecklistChange(index, e.target.value)}
                    placeholder="チェック項目を入力"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleChecklistRemove(index)}
                    aria-label="削除"
                    className="text-red-600 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className={`px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                !isOnline 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading || isSubmitting
                ? (mode === 'create' ? '作成中...' : '更新中...')
                : !isOnline
                ? (mode === 'create' ? 'オフライン作成' : 'オフライン更新')
                : (mode === 'create' ? '作成' : '更新')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};