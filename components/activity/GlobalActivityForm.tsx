'use client';

import { useActivityStore } from '@/lib/store/activity-store';
import { ActivityForm } from './ActivityForm';

/**
 * グローバルアクティビティ編集フォーム
 * ActivityStoreのshowEditFormとeditingActivityを監視し、
 * 編集フォームの表示状態を管理します。
 */
export const GlobalActivityForm = () => {
  const { 
    showEditForm, 
    editingActivity, 
    setShowEditForm, 
    setEditingActivity 
  } = useActivityStore();

  const handleClose = () => {
    setShowEditForm(false);
    setEditingActivity(null);
  };

  const handleSubmit = () => {
    // フォームの保存処理は ActivityForm 内で実行される
    // ここではフォームを閉じるだけ
    handleClose();
  };

  if (!showEditForm) {
    return null;
  }

  return (
    <ActivityForm
      mode={editingActivity ? 'edit' : 'create'}
      activity={editingActivity || undefined}
      onClose={handleClose}
      onSubmit={handleSubmit}
    />
  );
};